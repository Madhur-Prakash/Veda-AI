# VedaAI — Full Documentation

VedaAI is an AI-powered assessment generation platform for teachers. Describe your assignment, configure question types and difficulty distribution, and the system generates a complete question paper with an answer key — delivered as a PDF.

---

## Documentation Index

| Document | Description |
|---|---|
| [Setup Instructions](./setup.md) | Install, configure, and run locally |
| [Architecture Overview](./architecture.md) | System design, BullMQ flow, Socket.IO rooms, data flow diagrams |
| [API Reference](./api-reference.md) | All REST endpoints, WebSocket events, schemas, error codes |
| [Tech Stack](./tech-stack.md) | Every dependency, full data flow from backend to frontend |
| [Approach & Design](./approach.md) | Design decisions, BullMQ rationale, Socket.IO strategy, what's UI-only |
| [Deployment Guide](./deployment.md) | Docker, manual, Vercel+Railway, env vars, scaling notes |

---

## Quick Start

```bash
# 1. Start infrastructure
cd backend && docker-compose up -d mongo redis

# 2. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env — add GROQ_API_KEY and JWT_SECRET

# 3. Seed demo accounts
cd backend && npm install && npm run seed

# 4. Start backend (includes BullMQ worker)
npm run dev

# 5. Start frontend (new terminal)
cd ../frontend && npm install && npm run dev

# 6. Open http://localhost:3000
```

---

## How It Works

```
Teacher fills form
      │
      ▼
POST /api/v1/assignments
      │
      ├── MongoDB: Assignment { status: QUEUED }
      ├── Redis:   BullMQ job enqueued
      └── MongoDB: GenerationJob { progress: 0 }
      │
      ▼
HTTP 201 → frontend navigates to /generation-status
      │
      ▼ (async — BullMQ worker, concurrency: 3)
Worker picks up job from Redis
      │
      ├── Socket.IO: generation.started
      ├── PromptBuilder → Groq API (llama-3.3-70b, temp: 0.2, json_object)
      ├── Socket.IO: generation.progress (10% → 30% → 75%)
      ├── MongoDB: Assignment.generatedAssessment saved, status: COMPLETED
      ├── MongoDB: AssignmentVersion snapshot created
      └── Socket.IO: generation.completed { assignment }
      │
      ▼
Frontend useSocket hook receives generation.completed
      │
      ├── generationStore.setCompleted(assignment)
      └── router.push('/assessment/:id')  after 1.5s
      │
      ▼
Teacher views assessment, downloads PDF
```

---

## Project Structure

```
VedaAI/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── assignment.controller.ts   HTTP handlers for assignments
│   │   │   ├── auth.controller.ts         HTTP handlers for auth
│   │   │   ├── routes.ts                  Express router, middleware chains
│   │   │   └── validators.ts              Zod schemas for all request bodies
│   │   ├── middleware/
│   │   │   ├── auth.ts                    requireAuth — JWT verification
│   │   │   ├── errorHandler.ts            notFoundHandler + errorHandler
│   │   │   ├── requestId.ts               x-request-id header
│   │   │   └── validate.ts                validateBody(ZodSchema)
│   │   ├── models/
│   │   │   ├── assignment.model.ts        Assignment Mongoose schema
│   │   │   ├── draft.model.ts             AssignmentDraft schema
│   │   │   ├── job.model.ts               GenerationJob schema
│   │   │   ├── user.model.ts              User schema
│   │   │   └── version.model.ts           AssignmentVersion schema
│   │   ├── queues/
│   │   │   └── assignment.queue.ts        BullMQ Queue instance
│   │   ├── scripts/
│   │   │   └── seed.ts                    Demo users + assignments
│   │   ├── services/
│   │   │   ├── aiProvider.ts              GroqAiProvider — LLM calls
│   │   │   ├── assignment.service.ts      create, generateNow, completeGeneration, exportPdf
│   │   │   ├── auth.service.ts            register, login, refresh, logout, getMe
│   │   │   ├── jsonRepair.ts              tryParseJson — strips markdown fences
│   │   │   ├── mongo.ts                   connectMongo()
│   │   │   ├── pdfService.ts              generatePdfBuffer() — PDFKit
│   │   │   ├── promptBuilder.ts           buildPrompt() — system + user prompt
│   │   │   └── redis.ts                   ioredis client + connectRedis()
│   │   ├── utils/
│   │   │   ├── asyncHandler.ts            Wraps async controllers
│   │   │   ├── httpError.ts               HttpError class with statusCode
│   │   │   └── id.ts                      createId(prefix) — nanoid
│   │   ├── websocket/
│   │   │   └── socket.ts                  initSocket(), emitAssignmentEvent()
│   │   ├── workers/
│   │   │   └── assignment.worker.ts       BullMQ Worker — full generation pipeline
│   │   ├── config.ts                      Zod-validated env config
│   │   ├── server.ts                      Express app bootstrap
│   │   └── types.ts                       Shared TypeScript types
│   ├── .env.example
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                       Dashboard (stats + recent assignments)
│   │   ├── layout.tsx                     Root layout (Manrope + Space Grotesk fonts)
│   │   ├── globals.css                    Tailwind base styles
│   │   ├── auth/login/page.tsx            Login form
│   │   ├── auth/register/page.tsx         Register form
│   │   ├── create-assignment/page.tsx     Assignment creation form
│   │   ├── generation-status/page.tsx     Real-time progress (useSocket)
│   │   ├── assessment/[id]/page.tsx       View assessment + PDF download
│   │   ├── assignments/page.tsx           List + search assignments
│   │   ├── output/page.tsx                Alternate assessment view
│   │   ├── library/page.tsx               Saved papers, question bank, templates
│   │   ├── groups/page.tsx                Class groups (UI)
│   │   ├── toolkit/page.tsx               AI tools (UI)
│   │   └── settings/page.tsx              Settings placeholder
│   ├── components/
│   │   ├── shell.tsx                      App layout (sidebar + header + auth guard)
│   │   └── ui/
│   │       ├── button.tsx                 Button component (4 variants)
│   │       ├── card.tsx                   Card component
│   │       ├── badge.tsx                  Badge component
│   │       └── input.tsx                  Input component
│   ├── hooks/
│   │   └── useSocket.ts                   Socket.IO hook (singleton + room management)
│   ├── lib/
│   │   ├── api.ts                         Axios instance + auth interceptors + API methods
│   │   └── utils.ts                       cn() — clsx + tailwind-merge
│   ├── store/
│   │   ├── authStore.ts                   Auth state (Zustand + localStorage persist)
│   │   ├── assignmentStore.ts             Assignment CRUD state
│   │   └── generationStore.ts             Real-time generation state
│   ├── types/
│   │   └── index.ts                       All TypeScript interfaces
│   ├── middleware.ts                       Next.js middleware (public path bypass)
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   └── package.json
│
└── docs/                                  This documentation
    ├── index.md
    ├── setup.md
    ├── architecture.md
    ├── api-reference.md
    ├── tech-stack.md
    ├── approach.md
    └── deployment.md
```

---

## Demo Accounts

After `cd backend && npm run seed`:

| Name | Email | Password | School |
|---|---|---|---|
| Sarah Johnson | sarah@vedaai.dev | password123 | Delhi Public School |
| Raj Sharma | raj@vedaai.dev | password123 | Kendriya Vidyalaya |

Sarah has two seeded assignments: one COMPLETED (Quiz on Electricity) and one PROCESSING (Chapter Test – Photosynthesis). Raj has one QUEUED assignment (Algebra Mid-Term).
