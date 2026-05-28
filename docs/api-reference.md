# API Reference

## Base URLs

| Environment | URL |
|---|---|
| Local dev | `http://localhost:4000/api/v1` |
| Production (Render) | `https://your-backend.onrender.com/api/v1` |
| Fallback (zrok tunnel) | `https://vediaai.share.zrok.io/api/v1` |

## Request Format

Protected routes require:
```
Authorization: Bearer <accessToken>
```

All request bodies must be `Content-Type: application/json`.

## Response Envelope

Every response uses a consistent envelope:

```json
// Success
{ "data": { ... } }

// Error
{ "error": { "message": "Human-readable message", "statusCode": 400 } }
```

Every response also includes an `x-request-id` header (nanoid-generated or passed through from the client).

---

## Health

### GET /health

Public. No auth required.

```json
{ "ok": true, "service": "vedaai-backend" }
```

---

## Auth

### POST /auth/register

Register a new teacher account.

**Body** (validated by Zod)
```json
{
  "name": "Sarah Johnson",
  "email": "sarah@school.edu",
  "password": "securepassword",
  "school": "Delhi Public School"
}
```

| Field | Type | Constraints |
|---|---|---|
| name | string | 2–80 chars, required |
| email | string | valid email, required |
| password | string | 8–128 chars, required |
| school | string | max 120 chars, optional |

**Response 201**
```json
{
  "data": {
    "user": {
      "externalId": "usr_abc1234567",
      "name": "Sarah Johnson",
      "email": "sarah@school.edu",
      "role": "teacher",
      "school": "Delhi Public School",
      "avatarUrl": "",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    "accessToken": "<jwt>"
  }
}
```

Sets `refreshToken` as an `httpOnly`, `sameSite: lax` cookie (30-day expiry). `secure: true` in production.

**Errors**
- `409` — Email already in use

---

### POST /auth/login

**Body**
```json
{
  "email": "sarah@school.edu",
  "password": "securepassword"
}
```

**Response 200** — same shape as register. Sets `refreshToken` cookie.

**Errors**
- `401` — Invalid credentials

---

### POST /auth/refresh

Uses the `refreshToken` httpOnly cookie to issue a new access token. No body required.

**Response 200**
```json
{ "data": { "accessToken": "<new-jwt>" } }
```

**Errors**
- `401` — No refresh token / invalid / revoked

---

### POST /auth/logout

Requires auth. Clears the refresh token from the database and clears the cookie.

**Response 200**
```json
{ "data": { "ok": true } }
```

---

### GET /auth/me

Requires auth. Returns the current user's profile (no `passwordHash` or `refreshToken`).

**Response 200**
```json
{
  "data": {
    "externalId": "usr_abc1234567",
    "name": "Sarah Johnson",
    "email": "sarah@school.edu",
    "role": "teacher",
    "school": "Delhi Public School",
    "avatarUrl": "",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

## Dashboard

### GET /dashboard/summary

Requires auth. Returns aggregate stats for the authenticated teacher.

**Response 200**
```json
{
  "data": {
    "totalAssignments": 12,
    "completedAssignments": 10,
    "processingJobs": 1,
    "successRate": 83
  }
}
```

`successRate` = `Math.round((completedAssignments / totalAssignments) * 100)`. Returns `0` if no assignments.

---

## Assignments

### GET /assignments

Requires auth. Returns all assignments owned by the authenticated teacher, sorted newest first.

**Response 200**
```json
{
  "data": [
    {
      "_id": "...",
      "externalId": "asmt_xyz1234567",
      "teacherId": "usr_abc1234567",
      "title": "Mid-Term Science Test",
      "subject": "Science",
      "className": "Grade 8",
      "topic": "Force and Motion",
      "dueDate": "2025-02-01T00:00:00.000Z",
      "durationMinutes": 60,
      "totalMarks": 50,
      "inputSource": "paste",
      "content": "",
      "instructions": "",
      "learningOutcomes": [],
      "bloomTaxonomy": [],
      "language": "English",
      "strictMode": false,
      "questionControls": [...],
      "status": "COMPLETED",
      "generationJobId": "42",
      "generatedAssessment": { "sections": [...] },
      "pdfUrl": "/api/v1/assignments/asmt_xyz1234567/export/pdf",
      "version": 1,
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:02:00.000Z"
    }
  ]
}
```

---

### GET /assignments/:id

Requires auth. `:id` is the `externalId` (e.g. `asmt_xyz1234567`).

Returns the full assignment document including `generatedAssessment`.

**Response 404** if not found or not owned by the authenticated user.

---

### POST /assignments

Requires auth. Creates an assignment and immediately enqueues AI generation via BullMQ.

**Body**
```json
{
  "title": "Mid-Term Science Test",
  "subject": "Science",
  "className": "Grade 8",
  "topic": "Force and Motion",
  "dueDate": "2025-02-01T00:00:00.000Z",
  "durationMinutes": 60,
  "totalMarks": 50,
  "inputSource": "paste",
  "content": "Optional reference text for the AI",
  "instructions": "Focus on conceptual understanding",
  "learningOutcomes": ["Understand Newton's laws"],
  "bloomTaxonomy": ["Remember", "Apply"],
  "language": "English",
  "strictMode": false,
  "questionControls": [
    {
      "type": "MCQ",
      "count": 10,
      "marks": 1,
      "difficultyDistribution": { "easy": 40, "medium": 40, "hard": 20 }
    },
    {
      "type": "Short",
      "count": 5,
      "marks": 4,
      "difficultyDistribution": { "easy": 20, "medium": 60, "hard": 20 }
    }
  ]
}
```

**Field constraints**

| Field | Type | Constraints |
|---|---|---|
| title | string | 3–120 chars |
| subject | string | 2–80 chars |
| className | string | 1–40 chars |
| topic | string | 2–160 chars |
| dueDate | ISO 8601 with offset | must be in the future |
| durationMinutes | integer | 5–600 |
| totalMarks | integer | 1–1000 |
| inputSource | enum | `pdf` \| `txt` \| `paste` |
| content | string | optional |
| instructions | string | optional |
| learningOutcomes | string[] | optional |
| bloomTaxonomy | string[] | optional |
| language | string | optional, default `"English"` |
| strictMode | boolean | optional, default `false` |
| questionControls | array | min 1 item |
| questionControls[].type | enum | `MCQ` \| `Short` \| `Long` \| `Case Study` \| `True False` |
| questionControls[].count | integer | 1–100 |
| questionControls[].marks | integer | 1–100 |
| questionControls[].difficultyDistribution.easy | integer | ≥ 0 |
| questionControls[].difficultyDistribution.medium | integer | ≥ 0 |
| questionControls[].difficultyDistribution.hard | integer | ≥ 0 |

**Response 201**
```json
{
  "data": {
    "externalId": "asmt_xyz1234567",
    "status": "QUEUED",
    "generationJobId": "42",
    ...
  }
}
```

After this response, the frontend should connect to Socket.IO and join room `assignment:asmt_xyz1234567` to receive progress events.

**Errors**
- `400` — Validation failure or due date in the past

---

### POST /assignments/:id/regenerate

Requires auth. Sets the assignment status to `REGENERATING`. The worker will pick it up and re-run generation.

**Body** (optional)
```json
{ "notes": "Make questions harder" }
```

**Response 202**
```json
{
  "data": {
    "assignmentExternalId": "asmt_xyz1234567",
    "state": "REGENERATING"
  }
}
```

**Errors**
- `404` — Assignment not found or not owned by user

---

### GET /assignments/:id/export/pdf

Requires auth. Generates and streams a PDF of the completed assessment.

**Response 200**
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="assignment-{id}.pdf"`
- Body: binary PDF buffer

The PDF contains:
- Page 1: Header (title, subject, class, time, marks), student info fields, all sections with questions, difficulty badges, Bloom's level tags
- Page 2: Answer key grouped by section

**Errors**
- `404` — Assignment not found or `generatedAssessment` is null (not yet generated)

---

## WebSocket API

Connect using Socket.IO client v4. Use the appropriate base URL for your environment:

| Environment | URL |
|---|---|
| Local dev | `http://localhost:4000` |
| Production (Render) | `https://your-backend.onrender.com` |
| Fallback (zrok tunnel) | `https://vediaai.share.zrok.io` |

```js
import { io } from 'socket.io-client';
const socket = io('https://your-backend.onrender.com', { withCredentials: true });
```

> When the frontend is on Vercel and `NEXT_PUBLIC_SOCKET_URL` is not set to a public URL, socket traffic is automatically proxied through the Next.js `/socket.io` rewrite to avoid CORS issues.

### Client → Server Events

| Event | Payload | Description |
|---|---|---|
| `join_assignment` | `assignmentId: string` | Join room `assignment:{id}` to receive that assignment's events |
| `leave_assignment` | `assignmentId: string` | Leave the room |

### Server → Client Events

| Event | Payload | Trigger |
|---|---|---|
| `connected` | `{ socketId: string }` | Immediately on connection |
| `generation.started` | `{ assignmentExternalId, jobId }` | Worker picks up the BullMQ job |
| `generation.progress` | `{ assignmentExternalId, progress: number, message: string }` | Emitted at 10%, 30%, 75%, 100% |
| `generation.completed` | `{ assignmentExternalId, assignment: Assignment }` | Full assignment saved to MongoDB |
| `generation.failed` | `{ assignmentExternalId, error: string }` | Worker throws an error |
| `pdf.generated` | `{ assignmentExternalId, pdfUrl: string }` | After generation.completed |

Events are emitted to both the specific room (`assignment:{id}`) and globally.

### Progress Steps (frontend display)

The `/generation-status` page maps progress values to named steps:

| Progress threshold | Step label |
|---|---|
| 0 | Assignment queued |
| 20 | Building AI prompt |
| 40 | Generating questions |
| 70 | Validating output |
| 90 | Saving assessment |
| 100 | Complete |

---

## Generated Assessment Schema

The `generatedAssessment` field on a completed assignment:

```json
{
  "sections": [
    {
      "title": "Section A — Multiple Choice Questions",
      "instruction": "Choose the correct answer. Each question carries 1 mark.",
      "questions": [
        {
          "id": "q1",
          "question": "What is Newton's first law of motion?",
          "difficulty": "Easy",
          "marks": 1,
          "type": "MCQ",
          "answer_key": "An object at rest stays at rest unless acted upon by an external force.",
          "blooms_level": "Remember",
          "estimated_time": "1 min"
        }
      ]
    }
  ]
}
```

**Enums**

| Field | Values |
|---|---|
| `difficulty` | `Easy` \| `Medium` \| `Hard` |
| `type` | `MCQ` \| `Short` \| `Long` \| `Case Study` \| `True False` |
| `blooms_level` | Remember, Understand, Apply, Analyze, Evaluate, Create |

---

## Job States

The `status` field on an assignment and `state` on a GenerationJob:

| State | Meaning |
|---|---|
| `QUEUED` | Job created, waiting for worker |
| `PROCESSING` | Worker is actively generating |
| `COMPLETED` | Assessment saved, PDF available |
| `FAILED` | Worker threw an error |
| `REGENERATING` | Marked for re-generation |

---

## Error Codes

| Status | Meaning |
|---|---|
| 400 | Validation error (Zod) or business rule violation |
| 401 | Missing/invalid/expired token or refresh token |
| 404 | Resource not found or not owned by user |
| 409 | Conflict (e.g. email already registered) |
| 500 | Unexpected server error |
| 502 | Groq API returned empty or malformed response |
