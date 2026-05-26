# Approach & Design Decisions

## Problem Statement

Teachers spend significant time creating assessment papers — selecting question types, balancing difficulty, writing questions, and formatting PDFs. VedaAI automates this using an LLM while giving teachers full control over the structure.

---

## Async-First Generation with BullMQ

AI generation takes 2–10 seconds. Blocking an HTTP request for that long is a bad user experience and wastes server resources. The solution:

1. `POST /assignments` returns `201` immediately with the assignment ID
2. The job is serialised into Redis via BullMQ
3. A background worker processes it asynchronously
4. Progress is streamed to the browser via Socket.IO

**Why BullMQ over a simple `setTimeout` or `Promise`?**
- Jobs survive server restarts (persisted in Redis)
- Built-in retry on failure
- Concurrency control (`concurrency: 3`)
- Job state tracking (QUEUED → PROCESSING → COMPLETED/FAILED)
- The `GenerationJob` MongoDB document mirrors the BullMQ state for persistence

**Worker lifecycle:**
The worker is instantiated by importing `assignment.worker.ts` in `server.ts`. It connects to Redis using the same `REDIS_URL` env var, parsed into `{ host, port, password, db }`. The queue name is `assignments` and all Redis keys are prefixed with `QUEUE_PREFIX` (default: `vedaai`).

---

## Real-Time Progress with Socket.IO

The frontend needs to know when generation completes without polling. Socket.IO rooms solve this cleanly:

- Each assignment gets a room: `assignment:{externalId}`
- The browser joins the room immediately after creating the assignment
- The worker emits events into that room at each progress milestone
- Events are also broadcast globally (`io.emit`) so any connected client can receive them

**Why rooms instead of user-level channels?**
Multiple browser tabs or devices can watch the same assignment's progress. Rooms are the natural fit.

**Singleton socket on the frontend:**
`getSocket()` returns a module-level singleton. This prevents creating a new connection on every component mount. The `useSocket` hook manages joining/leaving rooms and wiring/unwiring event listeners on mount/unmount.

---

## Structured Prompt Engineering

The prompt is built deterministically from the user's input in `promptBuilder.ts`:

```
system: deterministic instructions — no markdown, no commentary, JSON only
user:   { assignment: input, outputSchema: { sections: [...] } }
```

Key choices:
- `temperature: 0.2` — low randomness for consistent, structured output
- `response_format: { type: "json_object" }` — Groq enforces valid JSON
- The output schema is embedded in the prompt so the model knows exactly what shape to produce
- `jsonRepair.ts` strips markdown code fences as a fallback if the model adds them anyway

---

## JWT Auth Strategy

Two-token pattern:
- **Access token** (7d) — short-lived JWT, stored in `localStorage`, attached via Axios interceptor
- **Refresh token** (30d) — long-lived JWT, stored in `httpOnly` cookie (XSS-safe)

On 401, the Axios response interceptor automatically calls `/auth/refresh` (the cookie is sent automatically by the browser), gets a new access token, and retries the original request once. This is transparent to the user.

The refresh token is also stored in the `users` collection. On logout, it's cleared from the DB, making the token single-use and revocable.

---

## ID Strategy

All public IDs use `nanoid(10)` with a human-readable prefix:
- `usr_` for users
- `asmt_` for assignments
- `req_` for request IDs

This keeps MongoDB `_id` (ObjectId) internal and never exposed in URLs or API responses. It also makes IDs recognisable in logs and URLs.

---

## Versioning and Drafts

Every time an assessment is generated or regenerated:
- `AssignmentVersion` stores a snapshot of `generatedAssessment` with the version number
- `AssignmentDraft` stores the original input payload before generation starts

This means:
- If generation fails, the draft can be used to retry without the user re-entering data
- Future rollback/comparison features can be built without data loss
- `assignment.version` increments on every successful generation

---

## Frontend Architecture

### App Router + Client Components

Next.js 15 App Router is used for routing. All interactive pages are `'use client'` because they depend on Zustand stores, WebSocket hooks, and browser APIs (`localStorage`, `window`).

### Shell Component

A single `Shell` component wraps all authenticated pages, providing:
- Sidebar with navigation links
- Top header with back button, page title, notifications dropdown, user dropdown
- Auth guard: `useEffect(() => { if (!user) router.replace('/auth/login') }, [user])`

This avoids duplicating layout code and ensures unauthenticated users are always redirected.

### Zustand over Context

- No provider wrapping needed
- Selective subscriptions — components only re-render when their slice changes
- Built-in `persist` middleware syncs `authStore` to `localStorage`
- Simpler async action patterns than `useReducer` + Context

### Axios Interceptors

Two interceptors in `lib/api.ts`:
1. **Request interceptor** — reads `localStorage.accessToken` and attaches `Authorization: Bearer`
2. **Response interceptor** — on 401, calls `/auth/refresh`, updates token, retries once

This means no component ever needs to manually handle token refresh.

---

## Backend Layering

```
Routes → Middleware → Controllers → Services → Models
```

- **Routes** (`routes.ts`) — define endpoints, apply middleware chains
- **Middleware** — `requireAuth`, `validateBody`, `asyncHandler`, `errorHandler`, `requestId`
- **Controllers** — thin HTTP layer: extract params, call services, send responses
- **Services** — all business logic, no HTTP concerns
- **Models** — Mongoose schemas only, no business logic

`asyncHandler` wraps every async controller so thrown errors (including `HttpError`) are passed to Express's error middleware without try/catch in every controller.

---

## What's UI-Only (No Backend Integration)

These pages have full UI but no backend wiring:

| Page | Path | What it shows |
|---|---|---|
| My Groups | `/groups` | Static group cards with student counts, activity feed |
| AI Teacher's Toolkit | `/toolkit` | 6 tool cards (Rubric Generator, Bloom's Analyzer, etc.) with a mock 1.2s delay |
| My Library | `/library` | Saved papers, question bank, templates — all static data |
| Settings | `/settings` | Placeholder card |
| Output | `/output` | Alternate assessment view, fetches from store but no dedicated backend route |

The Toolkit tools show a simulated response after 1.2 seconds. The actual Groq API calls for these tools are not yet implemented.
