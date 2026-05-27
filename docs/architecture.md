# Architecture Overview

## High-Level System Design

VedaAI is a full-stack monorepo with a decoupled Express backend and a Next.js frontend. The two communicate over REST (HTTP) and WebSockets (Socket.IO). AI generation is always async — it never blocks an HTTP request.

```
┌──────────────────────────────────────────────────────────────────────┐
│                         BROWSER (Next.js 15)                         │
│                                                                      │
│  Pages: login · register · create-assignment · generation-status     │
│         assessment/[id] · assignments · library · groups · toolkit   │
│                                                                      │
│  State: authStore (Zustand+persist) · assignmentStore · generationStore │
│  HTTP:  Axios (Bearer token interceptor + auto-refresh on 401)       │
│  WS:    useSocket hook → Socket.IO client (singleton)                │
└────────────────┬──────────────────────────────┬─────────────────────┘
                 │  REST  /api/v1                │  WebSocket (ws://)
                 ▼                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    EXPRESS SERVER  (port 4000)                        │
│                                                                      │
│  Middleware stack:                                                   │
│    helmet → cors → cookieParser → json → requestId                  │
│                                                                      │
│  ┌─────────────────────┐    ┌──────────────────────────────────┐    │
│  │   REST API Router   │    │       Socket.IO Server           │    │
│  │   /api/v1           │    │  rooms: assignment:{externalId}  │    │
│  │                     │    │  events: generation.*  pdf.*     │    │
│  │  auth.*  (public)   │    └──────────────────────────────────┘    │
│  │  assignments.*      │                                            │
│  │  dashboard.summary  │                                            │
│  └──────────┬──────────┘                                            │
│             │                                                        │
│             ▼                                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                     Service Layer                             │   │
│  │  AuthService · AssignmentService · GroqAiProvider            │   │
│  │  PromptBuilder · PdfService (PDFKit) · JsonRepair            │   │
│  └──────────────────────────────────────────────────────────────┘   │
│             │                              │                         │
│             ▼                              ▼                         │
│  ┌──────────────────┐          ┌───────────────────────┐            │
│  │    MongoDB 7     │          │   Redis 7 (ioredis)   │            │
│  │  (Mongoose ODM)  │          │   BullMQ job queue    │            │
│  │                  │          └──────────┬────────────┘            │
│  │  users           │                     │                         │
│  │  assignments     │          ┌──────────▼────────────┐            │
│  │  generationjobs  │          │   BullMQ Worker       │            │
│  │  assignmentdrafts│          │   concurrency: 3      │            │
│  │  assignmentversions         │   queue: assignments  │            │
│  └──────────────────┘          └──────────┬────────────┘            │
│                                           │                         │
│                                           ▼                         │
│                                ┌──────────────────────┐             │
│                                │   Groq API           │             │
│                                │   llama-3.3-70b      │             │
│                                │   temp: 0.2          │             │
│                                │   json_object mode   │             │
│                                └──────────────────────┘             │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Request Lifecycle: Creating an Assignment

```
1. Browser  →  POST /api/v1/assignments  { Authorization: Bearer <token> }
               Body: { title, subject, topic, questionControls, ... }

2. Express  →  requireAuth middleware verifies JWT
           →  validateBody(createAssignmentSchema) runs Zod parse
           →  createAssignment controller calls AssignmentService.create()

3. AssignmentService.create()
   ├── Validates dueDate is in the future (throws HttpError 400 if not)
   ├── Creates Assignment doc in MongoDB  { status: "QUEUED" }
   ├── assignmentsQueue.add('generate-assignment', { assignmentExternalId, input })
   │     └── BullMQ serialises job to Redis
   ├── Creates GenerationJob doc  { state: "QUEUED", progress: 0 }
   ├── Updates Assignment.generationJobId = job.id
   └── Creates AssignmentDraft doc (input payload snapshot)

4. HTTP 201 → { data: { externalId: "asmt_xxx", status: "QUEUED", ... } }

5. Browser  →  stores assignment, navigates to /generation-status?id=asmt_xxx
           →  useSocket hook connects and emits join_assignment("asmt_xxx")
           →  if generation fails, the page retries the same assignment in place using the saved draft
```

---

## BullMQ: Async Job Processing

```
Redis Queue: "vedaai:assignments"
                │
                │  BullMQ Worker (concurrency: 3)
                ▼
  job.data = { assignmentExternalId, input: AssignmentCreateInput }
                │
  ┌─────────────▼──────────────────────────────────────────────────┐
  │  1. GenerationJobModel.update → state: PROCESSING, progress: 10 │
  │  2. emitAssignmentEvent('generation.started', ...)              │
  │  3. emitProgress(10, 'Starting generation')                     │
  │  4. emitProgress(30, 'Building prompt')                         │
  │  5. PromptBuilder.buildPrompt(input)                            │
  │  6. GroqAiProvider.generateAssessment(prompt)                   │
  │       └── groq.chat.completions.create(...)  ← network call    │
  │       └── tryParseJson(raw)                                     │
  │  7. GenerationJobModel.update → progress: 75                    │
  │  8. emitProgress(75, 'Validating and saving assessment')        │
  │  9. AssignmentService.completeGeneration(externalId, assessment)│
  │       ├── Assignment.generatedAssessment = assessment           │
  │       ├── Assignment.status = 'COMPLETED'                       │
  │       ├── Assignment.version += 1                               │
  │       ├── Assignment.pdfUrl = '/api/v1/assignments/:id/export/pdf'│
  │       └── Creates AssignmentVersion snapshot                    │
  │ 10. GenerationJobModel.update → state: COMPLETED, progress: 100 │
  │ 11. emitProgress(100, 'Generation completed')                   │
  │ 12. emitAssignmentEvent('generation.completed', { assignment }) │
  │ 13. emitAssignmentEvent('pdf.generated', { pdfUrl })            │
  └────────────────────────────────────────────────────────────────┘
                │
  On failure:
  ├── GenerationJobModel.update → state: FAILED
  └── emitAssignmentEvent('generation.failed', { error })
```

**Worker config:**
- Queue name: `assignments`
- Redis key prefix: `vedaai` (from `QUEUE_PREFIX` env var)
- Concurrency: `3` (up to 3 jobs processed simultaneously)
- Connection: parsed from `REDIS_URL` env var

---

## Socket.IO: Real-Time Progress

```
Server initialisation (initSocket):
  new Server(httpServer, { cors: { origin: CLIENT_ORIGIN } })

  io.on('connection', socket => {
    socket.emit('connected', { socketId })

    socket.on('join_assignment', id  => socket.join(`assignment:${id}`))
    socket.on('leave_assignment', id => socket.leave(`assignment:${id}`))
  })

emitAssignmentEvent(event, payload):
  io.to(`assignment:${payload.assignmentExternalId}`).emit(event, payload)
  io.emit(event, payload)   ← also broadcast globally
```

**Frontend (useSocket hook):**
```
getSocket() → singleton Socket.IO client (lazy init, autoConnect: false)

useSocket(assignmentId):
  1. s.connect()  (if not already connected)
  2. s.emit('join_assignment', assignmentId)
  3. s.on('generation.progress', data => generationStore.setProgress(...))
  4. s.on('generation.completed', data => {
       generationStore.setCompleted(data.assignment)
       assignmentStore.setCurrentAssignment(data.assignment)
     })
  5. s.on('generation.failed', data => generationStore.setFailed(data.error))
  cleanup: s.off(...), s.emit('leave_assignment', assignmentId)
```

**Events emitted by server:**

| Event | Payload | When |
|---|---|---|
| `connected` | `{ socketId }` | On socket connection |
| `generation.started` | `{ assignmentExternalId, jobId }` | Worker picks up job |
| `generation.progress` | `{ assignmentExternalId, progress, message }` | At 10%, 30%, 75%, 100% |
| `generation.completed` | `{ assignmentExternalId, assignment }` | Full assignment object saved |
| `generation.failed` | `{ assignmentExternalId, error }` | Worker throws |
| `pdf.generated` | `{ assignmentExternalId, pdfUrl }` | After completion |

---

## MongoDB Collections

| Collection | Key Fields | Purpose |
|---|---|---|
| `users` | `externalId`, `email`, `passwordHash`, `refreshToken`, `role` | Teacher accounts |
| `assignments` | `externalId`, `teacherId`, `status`, `generatedAssessment`, `version` | Core assignment data + AI output |
| `generationjobs` | `jobId`, `assignmentExternalId`, `state`, `progress` | Job state tracking (0–100%) |
| `assignmentdrafts` | `teacherId`, `assignmentExternalId`, `payload` | Original input snapshot |
| `assignmentversions` | `assignmentExternalId`, `version`, `generatedAssessment` | Versioned assessment snapshots |

All collections use `externalId` (nanoid-based) as the public identifier. MongoDB `_id` is never exposed in API responses.

---

## Authentication Flow

```
Register/Login
  │
  ▼
AuthService hashes password (bcrypt, 12 rounds)
Signs accessToken  (JWT, 7d,  stored in localStorage)
Signs refreshToken (JWT, 30d, stored in httpOnly cookie)
  │
  ▼
Every API request:
  Axios interceptor reads localStorage → Authorization: Bearer <token>
  │
  ▼
requireAuth middleware:
  Reads Authorization header → verifyToken(jwt) → attaches req.user
  │
  ▼
On 401 response:
  Axios interceptor → POST /auth/refresh (cookie sent automatically)
  → new accessToken → localStorage → retry original request
```

---

## PDF Generation Flow

```
GET /api/v1/assignments/:id/export/pdf
  │
  ▼
AssignmentService.exportPdf()
  └── generatePdfBuffer(assessment, meta)
        │
        ▼
      PDFKit (A4, margin: 60)
        ├── Page 1: Header (title, subject, class, time, marks)
        │           Student info fields (Name, Roll No, Section)
        │           Sections loop:
        │             Section title + instruction
        │             Questions: Q1. text [Difficulty] (N Marks) • Bloom's level
        └── Page 2: Answer Key
                    Section titles + Q1. answer_key text
        │
        ▼
      Buffer.concat(chunks) → Buffer
        │
        ▼
      res.setHeader('Content-Type', 'application/pdf')
      res.send(buffer)
        │
        ▼
      Browser: blob URL → <a download> click
```

---

## Middleware Stack (Request Order)

```
helmet()              → security headers
cors()                → CLIENT_ORIGIN whitelist, credentials: true
cookieParser()        → parses refreshToken cookie
express.json()        → body parsing (2mb limit)
express.urlencoded()  → form data
requestIdMiddleware   → x-request-id header (nanoid or passthrough)
                      ↓
apiRouter /api/v1
  requireAuth         → JWT verification (protected routes only)
  validateBody(Zod)   → schema validation (POST routes)
  asyncHandler        → wraps async controllers, passes errors to next()
                      ↓
notFoundHandler       → 404 for unknown routes
errorHandler          → HttpError → statusCode, all others → 500
```
