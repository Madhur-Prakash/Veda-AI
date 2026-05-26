# Tech Stack

## Backend Dependencies

| Package | Version | Role |
|---|---|---|
| express | 4.21 | HTTP server, routing, middleware |
| typescript | 5.7 | Type safety across the entire backend |
| tsx | 4.19 | TypeScript dev runner with hot-reload (`tsx watch`) |
| mongoose | 8.9 | MongoDB ODM — schemas, models, queries |
| bullmq | 5.25 | Redis-backed job queue for async AI generation |
| ioredis | 5.4 | Redis client used by BullMQ and direct connections |
| socket.io | 4.8 | WebSocket server for real-time progress events |
| groq-sdk | 0.13 | Official Groq API client for LLM inference |
| jsonwebtoken | 9 | JWT signing and verification |
| bcryptjs | 3 | Password hashing (12 salt rounds) |
| pdfkit | 0.18 | Server-side A4 PDF generation |
| zod | 3.24 | Runtime schema validation for all request bodies and env vars |
| helmet | 8 | HTTP security headers (CSP, HSTS, etc.) |
| cors | 2.8 | Cross-origin request handling |
| cookie-parser | 1.4 | Parses `refreshToken` httpOnly cookie |
| nanoid | 5 | Collision-resistant ID generation with prefix |
| dotenv | 16.4 | Loads `.env` into `process.env` |
| morgan | 1.10 | HTTP request logging |
| multer | 2.1 | Multipart file upload handling (installed, not yet wired) |

## Frontend Dependencies

| Package | Version | Role |
|---|---|---|
| next | 15.1 | React framework — App Router, SSR, file-based routing |
| react / react-dom | 19 | UI library |
| typescript | 5.7 | Type safety |
| tailwindcss | 3.4 | Utility-first CSS |
| zustand | 5 | Global state management (authStore, assignmentStore, generationStore) |
| axios | 1.16 | HTTP client with request/response interceptors |
| socket.io-client | 4.8 | WebSocket client for real-time generation events |
| lucide-react | 0.468 | Icon library (all icons in the UI) |
| zod | 4 | Client-side schema validation |
| react-hook-form | 7.76 | Form state management |
| framer-motion | 11 | Animations |
| date-fns | 4.3 | Date formatting utilities |
| clsx | 2.1 | Conditional class names |
| tailwind-merge | 2.5 | Merges Tailwind classes without conflicts |

## Infrastructure

| Tool | Role |
|---|---|
| MongoDB 7 | Primary database |
| Redis 7 | BullMQ job queue backing store |
| Docker / Docker Compose | Local multi-service orchestration |
| Node.js 20 | Runtime for both backend and frontend |

---

## How Data Flows: Backend to Frontend

### 1. HTTP REST Flow

```
User action (e.g. submit form)
  │
  ▼
Zustand store action (e.g. assignmentStore.createAssignment(payload))
  │
  ▼
Axios POST /api/v1/assignments
  ├── interceptors.request: reads localStorage → Authorization: Bearer <token>
  └── withCredentials: true (sends refreshToken cookie)
  │
  ▼
Express: helmet → cors → cookieParser → json → requestId
  │
  ▼
requireAuth: verifyToken(jwt) → req.user = { userId, email, role }
  │
  ▼
validateBody(createAssignmentSchema): Zod.safeParse(req.body)
  │
  ▼
createAssignment controller → AssignmentService.create()
  ├── MongoDB: Assignment.create({ status: 'QUEUED', ... })
  ├── BullMQ: assignmentsQueue.add('generate-assignment', { externalId, input })
  ├── MongoDB: GenerationJob.create({ state: 'QUEUED', progress: 0 })
  └── MongoDB: AssignmentDraft.create({ payload: input })
  │
  ▼
HTTP 201 { data: { externalId, status: 'QUEUED', ... } }
  │
  ▼
Zustand: assignments = [newAssignment, ...prev]
  │
  ▼
router.push('/generation-status?id=asmt_xxx')
```

### 2. BullMQ + Redis Flow

```
Redis key: "vedaai:assignments" (QUEUE_PREFIX:queueName)
  │
  ▼
BullMQ Worker (assignment.worker.ts)
  Instantiated at server startup via import in server.ts
  connection: parsed from REDIS_URL
  concurrency: 3
  │
  ▼
Worker.process(job):
  job.data = { assignmentExternalId: "asmt_xxx", input: AssignmentCreateInput }
  │
  ├── 1. MongoDB: GenerationJob → state: PROCESSING, progress: 10
  ├── 2. Socket.IO: emit 'generation.started'
  ├── 3. Socket.IO: emit 'generation.progress' { progress: 10 }
  ├── 4. Socket.IO: emit 'generation.progress' { progress: 30, message: 'Building prompt' }
  ├── 5. PromptBuilder.buildPrompt(input) → { system, user }
  ├── 6. GroqAiProvider.generateAssessment(prompt)
  │     ├── groq.chat.completions.create({ model, temperature: 0.2, response_format: json_object })
  │     └── tryParseJson(raw) → GeneratedAssessment
  ├── 7. MongoDB: GenerationJob → progress: 75
  ├── 8. Socket.IO: emit 'generation.progress' { progress: 75 }
  ├── 9. AssignmentService.completeGeneration(externalId, assessment)
  │     ├── Assignment.generatedAssessment = assessment
  │     ├── Assignment.status = 'COMPLETED'
  │     ├── Assignment.version += 1
  │     ├── Assignment.pdfUrl = '/api/v1/assignments/asmt_xxx/export/pdf'
  │     └── AssignmentVersion.create({ version, generatedAssessment })
  ├── 10. MongoDB: GenerationJob → state: COMPLETED, progress: 100
  ├── 11. Socket.IO: emit 'generation.progress' { progress: 100 }
  ├── 12. Socket.IO: emit 'generation.completed' { assignment }
  └── 13. Socket.IO: emit 'pdf.generated' { pdfUrl }

  On error:
  ├── MongoDB: GenerationJob → state: FAILED
  └── Socket.IO: emit 'generation.failed' { error }
```

### 3. Socket.IO Real-Time Flow

```
Server (socket.ts):
  initSocket(httpServer)
    → new Server(server, { cors: { origin: CLIENT_ORIGIN } })
    → io.on('connection', socket => {
        socket.emit('connected', { socketId })
        socket.on('join_assignment', id => socket.join(`assignment:${id}`))
        socket.on('leave_assignment', id => socket.leave(`assignment:${id}`))
      })

  emitAssignmentEvent(event, payload):
    io.to(`assignment:${payload.assignmentExternalId}`).emit(event, payload)
    io.emit(event, payload)   ← global broadcast too

─────────────────────────────────────────────────────────────

Frontend (hooks/useSocket.ts):
  getSocket():
    singleton: io(NEXT_PUBLIC_SOCKET_URL, { withCredentials: true, autoConnect: false })

  useSocket(assignmentId):
    1. s.connect()
    2. s.emit('join_assignment', assignmentId)
    3. s.on('generation.progress', data => {
         if data.assignmentExternalId === assignmentId:
           generationStore.setProgress(data.progress, data.message)
       })
    4. s.on('generation.completed', data => {
         generationStore.setCompleted(data.assignment)
         assignmentStore.setCurrentAssignment(data.assignment)
       })
    5. s.on('generation.failed', data => {
         generationStore.setFailed(data.error)
       })
    cleanup: s.off(...), s.emit('leave_assignment', assignmentId)

─────────────────────────────────────────────────────────────

generationStore (Zustand):
  status: 'idle' | 'queued' | 'processing' | 'completed' | 'failed'
  progress: 0–100
  message: string
  completedAssignment: Assignment | null

  setProgress(progress, message) → status: 'processing'
  setCompleted(assignment)       → status: 'completed', progress: 100
  setFailed(error)               → status: 'failed'

─────────────────────────────────────────────────────────────

GenerationStatusPage (/generation-status?id=asmt_xxx):
  useSocket(assignmentId)   ← wires all events
  reads generationStore     ← renders progress bar + step list
  useEffect: when status === 'completed' → setTimeout 1500ms → router.push('/assessment/:id')
```

### 4. Authentication Flow

```
Login:
  authStore.login(email, password)
    → POST /auth/login
    ← { data: { user, accessToken } }  +  Set-Cookie: refreshToken (httpOnly)
    → localStorage.setItem('accessToken', token)
    → Zustand: { user, accessToken }

Every request:
  Axios interceptors.request:
    token = localStorage.getItem('accessToken')
    config.headers.Authorization = `Bearer ${token}`

On 401:
  Axios interceptors.response:
    original._retry = true
    POST /auth/refresh  (cookie sent automatically by browser)
    ← { data: { accessToken: newToken } }
    localStorage.setItem('accessToken', newToken)
    retry original request with new token

Logout:
  authStore.logout()
    → POST /auth/logout  (clears refreshToken in DB + cookie)
    → localStorage.removeItem('accessToken')
    → Zustand: { user: null, accessToken: null }

Auth guard (Shell component):
  useEffect: if (!user) router.replace('/auth/login')
```

### 5. Zustand State Architecture

```
authStore (persisted to localStorage key 'vedaai-auth')
  state:  user, accessToken, isLoading, error
  actions: login, register, logout, loadMe, setToken, clearError

assignmentStore (in-memory)
  state:  assignments[], currentAssignment, dashboard, isLoading, error
  actions: fetchAssignments, fetchAssignment, createAssignment, regenerate,
           fetchDashboard, setCurrentAssignment

generationStore (in-memory)
  state:  status, progress, message, assignmentId, completedAssignment, error
  actions: setQueued, setProgress, setCompleted, setFailed, reset
  ← updated exclusively by useSocket hook events
```

### 6. AI Generation Pipeline

```
AssignmentCreateInput
  │
  ▼
promptBuilder.buildPrompt(input):
  system: "You are a deterministic exam paper generator.
           Return valid JSON only. Match the requested schema exactly.
           Never include markdown, commentary, or code fences.
           Avoid duplicates and balance question difficulty and marks."

  user: {
    assignment: input,
    outputSchema: {
      sections: [{
        title: "string",
        instruction: "string",
        questions: [{
          id, question, difficulty, marks, type,
          answer_key, blooms_level, estimated_time
        }]
      }]
    }
  }
  │
  ▼
GroqAiProvider.generateAssessment({ system, user }):
  groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    messages: [
      { role: "system", content: system },
      { role: "user",   content: JSON.stringify(user) }
    ],
    response_format: { type: "json_object" }
  })
  │
  ▼
tryParseJson(raw):
  try: JSON.parse(raw)
  catch: strip ```json fences → JSON.parse(trimmed)
  │
  ▼
Validate: parsed.sections is Array → throw HttpError(502) if not
  │
  ▼
GeneratedAssessment { sections: GenerationSection[] }
```

### 7. PDF Generation Pipeline

```
GET /api/v1/assignments/:id/export/pdf
  │
  ▼
AssignmentService.exportPdf(externalId)
  → Assignment.findOne({ externalId })
  → generatePdfBuffer(assessment, { title, subject, className, duration, totalMarks })
  │
  ▼
PDFKit (A4, margin: 60):
  Page 1:
    [school name if present]
    Title (center, 18pt bold)
    Subject + Class (center, 12pt)
    Time / Max Marks row
    Divider line
    Name / Roll No / Section fields
    For each section:
      Divider + Section title (center, 13pt bold)
      Instruction (italic, 10pt)
      For each question:
        Q{n}. question text
        [Difficulty] (N Marks) • Bloom's level
    "— End of Question Paper —"

  Page 2 (addPage):
    "Answer Key" heading
    For each section:
      Section title
      Q{n}. answer_key text

  doc.end() → Buffer.concat(chunks)
  │
  ▼
res.setHeader('Content-Type', 'application/pdf')
res.setHeader('Content-Disposition', 'attachment; filename="assignment-{id}.pdf"')
res.send(buffer)
  │
  ▼
Frontend:
  fetch(url, { headers: { Authorization: Bearer } })
  → response.blob()
  → URL.createObjectURL(blob)
  → <a download> click
```

---

## Frontend Page Map

| Route | File | Description |
|---|---|---|
| `/` | `app/page.tsx` | Dashboard — stats cards + recent assignments |
| `/auth/login` | `app/auth/login/page.tsx` | Login form with demo account quick-fill |
| `/auth/register` | `app/auth/register/page.tsx` | Registration form |
| `/create-assignment` | `app/create-assignment/page.tsx` | Full assignment creation form |
| `/generation-status` | `app/generation-status/page.tsx` | Real-time progress (useSocket) |
| `/assessment/[id]` | `app/assessment/[id]/page.tsx` | View assessment, download PDF, regenerate |
| `/assignments` | `app/assignments/page.tsx` | List all assignments with search |
| `/output` | `app/output/page.tsx` | Alternate assessment view (query param `?id=`) |
| `/library` | `app/library/page.tsx` | Saved papers, question bank, templates (UI) |
| `/groups` | `app/groups/page.tsx` | Class groups management (UI) |
| `/toolkit` | `app/toolkit/page.tsx` | AI tools: rubric, Bloom's analyzer, etc. (UI) |
| `/settings` | `app/settings/page.tsx` | Settings placeholder |

---

## Tailwind Design Tokens

Custom tokens defined in `tailwind.config.ts`:

| Token | Value | Usage |
|---|---|---|
| `ink` | `#1f1f1f` | Primary text, buttons |
| `mist` | `#f5f5f4` | Light backgrounds |
| `shell` | `#fbfbfa` | Card backgrounds |
| `line` | `#e8e5e3` | Borders |
| `accent` | `#ff6a2b` | Brand orange — CTAs, highlights |
| `accent.soft` | `#ffefe6` | Soft orange backgrounds |
| `font-sans` | Manrope | Body text |
| `font-display` | Space Grotesk | Headings, numbers |
