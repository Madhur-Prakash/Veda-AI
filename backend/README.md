# VedaAI Backend

Production-oriented Express + TypeScript backend for the VedaAI assessment creator.

## What is included

- Express API with request IDs, security middleware, and structured logging
- MongoDB models for assignments, generation jobs, and version history
- Redis-backed BullMQ queue for AI generation jobs
- Socket.IO gateway for assignment and generation progress events
- Deterministic prompt builder, Groq-backed AI abstraction, validator, and JSON repair pipeline
- PDF generation service via PDFKit-compatible structure points

## Run locally

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

## Core endpoints

- `GET /health`
- `GET /api/v1/dashboard/summary`
- `GET /api/v1/assignments`
- `POST /api/v1/assignments`
- `GET /api/v1/assignments/:id`
- `POST /api/v1/assignments/:id/regenerate`
- `GET /api/v1/assignments/:id/export/pdf`

## Notes

- The AI layer is abstracted behind a provider interface so Groq can be swapped or mocked.
- Queue workers update MongoDB and broadcast real-time progress over Socket.IO.