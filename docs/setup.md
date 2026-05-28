# Setup Instructions

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20+ | Required for both backend and frontend |
| npm | 10+ | Comes with Node.js 20 |
| MongoDB | 7+ | Can use Docker (recommended) or local install |
| Redis | 7+ | Required for BullMQ job queue |
| Groq API Key | — | Free at https://console.groq.com |

---

## 1. Clone & Install

```bash
git clone <repo-url>
cd VedaAI

cd backend && npm install
cd ../frontend && npm install
```

---

## 2. Configure Environment Variables

### Backend — `backend/.env`

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in:

```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_URL=redis://localhost:6379
CLIENT_ORIGIN=http://localhost:3000
JWT_SECRET=your-secret-key-at-least-10-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
AI_PROVIDER=groq
GROQ_API_KEY=gsk_your_key_here
GROQ_MODEL=llama-3.3-70b-versatile
QUEUE_PREFIX=vedaai
```

The `QUEUE_PREFIX` is prepended to all BullMQ Redis keys (e.g. `vedaai:assignments`).

### Frontend — `frontend/.env`

Already present in the repo. For local dev:

```env
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
BACKEND_API_URL=http://localhost:4000
```

For production (Vercel), set these in the Vercel dashboard:

```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api/v1
NEXT_PUBLIC_SOCKET_URL=https://your-backend.onrender.com
BACKEND_API_URL=https://your-backend.onrender.com
```

> `NEXT_PUBLIC_SOCKET_URL` — if this is a localhost URL but the page is served from a public domain, the `useSocket` hook automatically routes socket traffic through the Next.js `/socket.io` proxy rewrite instead of connecting directly to localhost.

---

## 3. Start Infrastructure

### Option A — Docker (recommended)

```bash
cd backend
docker-compose up -d mongo redis
```

This starts MongoDB on `27017` and Redis on `6379` with a persistent `mongo_data` volume.

### Option B — Local services

Start MongoDB and Redis using your system's service manager or run them directly. Ensure they are accessible at the URIs in your `.env`.

---

## 4. Seed Demo Data (optional)

```bash
cd backend
npm run seed
```

Creates two teacher accounts and three sample assignments (one COMPLETED with full assessment data, one PROCESSING, one QUEUED):

| Name | Email | Password | School |
|---|---|---|---|
| Sarah Johnson | sarah@vedaai.dev | password123 | Delhi Public School |
| Raj Sharma | raj@vedaai.dev | password123 | Kendriya Vidyalaya |

---

## 5. Start the Backend

```bash
cd backend
npm run dev
```

Uses `tsx watch` for hot-reload. Server starts on `http://localhost:4000`.

Verify: `GET http://localhost:4000/api/v1/health` → `{ "ok": true }`

The BullMQ worker (`assignment.worker.ts`) is imported directly in `server.ts` and starts automatically with the server.

---

## 6. Start the Frontend

```bash
cd frontend
npm run dev
```

Next.js dev server starts on `http://localhost:3000`.

---

## 7. Verify the Full Flow

1. Open `http://localhost:3000` → redirected to `/auth/login`
2. Log in with a seeded account
3. Click **Create Assignment**, fill the form, submit
4. Watch the real-time progress bar on `/generation-status`
5. After completion, view the assessment and download the PDF

---

## Available Scripts

### Backend

| Script | Command | Description |
|---|---|---|
| `dev` | `tsx watch src/server.ts` | Dev server with hot-reload |
| `build` | `tsc -p tsconfig.json` | Compile TypeScript to `dist/` |
| `start` | `node dist/server.js` | Run compiled production build |
| `seed` | `tsx src/scripts/seed.ts` | Seed demo users and assignments |
| `lint` | `eslint . --ext .ts` | Lint TypeScript files |

### Frontend

| Script | Command | Description |
|---|---|---|
| `dev` | `next dev` | Dev server with HMR |
| `build` | `next build` | Production build |
| `start` | `next start` | Serve production build |
| `lint` | `next lint` | ESLint via Next.js |

---

## Common Issues

**`MONGODB_URI` connection refused**
MongoDB is not running. Start it: `docker-compose up -d mongo`

**`REDIS_URL` connection refused**
Redis is not running. Start it: `docker-compose up -d redis`
BullMQ will fail to enqueue jobs and the worker will not start without Redis.

**Groq API errors (502)**
Check that `GROQ_API_KEY` is valid and has remaining quota at https://console.groq.com

**CORS errors in browser**
`CLIENT_ORIGIN` in `backend/.env` must exactly match the frontend URL including port — no trailing slash.

**`JWT_SECRET` validation error**
The secret must be at least 10 characters (enforced by Zod schema in `config.ts`).

**Generation stuck at 0%**
The BullMQ worker requires Redis. If Redis is down, jobs are enqueued but never processed. Check Redis connection.

**`refreshToken` cookie not sent**
In development, `secure: false` is set automatically when `NODE_ENV !== 'production'`. Ensure `withCredentials: true` is set on the Axios instance (it is, in `lib/api.ts`).
