# VedaAI

AI-powered assessment generation platform for teachers. Describe your assignment, configure question types and difficulty distribution, and get a complete question paper with answer key — exported as a PDF.

---

## 🚀 Live Deployments

|                                | URL                                  | Notes                              |
| ------------------------------ | ------------------------------------ | ---------------------------------- |
| **Frontend (Vercel)**          | **https://veda-ai-amber.vercel.app** | Primary live deployment            |
| **Local Server (zrok tunnel)** | https://vediaai.share.zrok.io        | Always running fallback deployment |

> **Recommended:** Use the Vercel deployment for the best overall experience.
> If the Vercel + Render deployment takes time to respond (especially when the Render backend wakes from inactivity), use the zrok tunnel instead.

### Important Notes

* The backend is currently hosted on **Render Free Tier**, which may spin down after inactivity. The first request can sometimes take around **20–30 seconds** to wake the backend.
* The **zrok tunnel deployment is always running locally** and can be used as a fallback during Render cold starts.
* Since the zrok deployment runs on a **local machine with limited hardware resources**, some requests may still take additional time for compilation or processing.
* During earlier deployment phases on AWS, response times were significantly faster and more stable due to better infrastructure resources.
* The AWS deployment was later taken down because of **limited server resources** and **AWS credit limitations/cost issues**.

### Deployment History

| Phase   | Frontend            | Backend                                                                  | Reason for change                                                   |
| ------- | ------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Initial | AWS (EC2 / Amplify) | AWS (EC2)                                                                | Better performance and infrastructure during initial deployment     |
| Current | **Vercel**          | **Render (Free Tier)** with fallback to local server via **zrok tunnel** | Switched due to AWS resource limitations and AWS credit/cost issues |

---

## Documentation

| | |
|---|---|
| [Setup Instructions](./docs/setup.md) | Install, configure, and run locally |
| [Architecture Overview](./docs/architecture.md) | System design, BullMQ flow, Socket.IO rooms, data flow |
| [API Reference](./docs/api-reference.md) | REST endpoints, WebSocket events, schemas, error codes |
| [Tech Stack](./docs/tech-stack.md) | Every dependency and full backend-to-frontend data flow |
| [Approach & Design](./docs/approach.md) | Design decisions, BullMQ rationale, Socket.IO strategy |
| [Deployment Guide](./docs/deployment.md) | Docker, manual, Vercel+Render, env vars, scaling |

---

## Quick Start

**Prerequisites:** Node.js 20+, MongoDB 7, Redis 7, Groq API key

```bash
# Start infrastructure
cd backend && docker-compose up -d mongo redis

# Configure backend
cp backend/.env.example backend/.env
# → Add your GROQ_API_KEY and JWT_SECRET to backend/.env

# Install and run backend (BullMQ worker starts automatically)
cd backend && npm install && npm run seed && npm run dev

# Install and run frontend (new terminal)
cd frontend && npm install && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## How It Works

```
Teacher fills form → POST /api/v1/assignments
                          │
                          ├── MongoDB: Assignment { status: QUEUED }
                          └── Redis:   BullMQ job enqueued
                          │
                          ▼ (async worker, concurrency: 3)
                    Worker picks up job from Redis
                          │
                          ├── Socket.IO: generation.started
                          ├── Groq LLM generates JSON assessment
                          ├── Socket.IO: generation.progress (10% → 75%)
                          ├── MongoDB: assessment saved, status: COMPLETED
                          └── Socket.IO: generation.completed
                          │
                          ▼
                    Frontend auto-redirects to /assessment/:id
                          │
                          ▼
                    Teacher views + downloads PDF
```

---

## Project Structure

```
VedaAI/
├── backend/     Express + TypeScript API, BullMQ worker, Socket.IO
├── frontend/    Next.js 15 App Router, Zustand, Tailwind CSS
└── docs/        Full documentation
```

---

## Tech Highlights

- **Groq LLM** (`llama-3.3-70b-versatile`) — fast structured JSON generation at `temperature: 0.2`
- **BullMQ + Redis** — async job queue, survives restarts, concurrency: 3
- **Socket.IO** — room-based real-time progress events (`assignment:{id}`)
- **PDFKit** — server-side A4 PDF with question paper + answer key
- **Zustand** — three stores: auth (persisted), assignments, generation state
- **JWT** — access token (localStorage) + httpOnly refresh cookie with auto-rotation

---

## Demo Accounts

After running `cd backend && npm run seed`:

| Name | Email | Password |
|---|---|---|
| Sarah Johnson | sarah@vedaai.dev | password123 |
| Raj Sharma | raj@vedaai.dev | password123 |
