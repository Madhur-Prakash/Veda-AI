# Deployment Guide

## Current Production Deployment

| Layer | Provider | URL |
|---|---|---|
| Frontend | Vercel | [https://veda-ai-amber.vercel.app](https://veda-ai-amber.vercel.app) |
| Backend | Render (free tier) + local zrok tunnel | [https://vediaai.share.zrok.io](https://vediaai.share.zrok.io) |
| Database | MongoDB Atlas (or Render-hosted) | — |
| Redis | Render Redis (free tier) | — |

### Deployment History

The project was initially deployed on **AWS** (EC2 for the backend, Amplify/S3 for the frontend). Due to cost and resource constraints on the free tier, it was migrated to:

- **Frontend → Vercel** — zero-config Next.js deployment, free tier, global CDN
- **Backend → Render** — free tier Node.js web service with auto-deploy from GitHub

Since Render's free tier spins down after 15 minutes of inactivity, a **local zrok tunnel** (`https://vediaai.share.zrok.io`) is also maintained as a fallback. The zrok tunnel points to a locally running backend instance and is only available when the local machine is on.

> **Note:** On first request to the Render backend, expect a ~30 second cold start delay.

---

## Option 1 — Vercel (Frontend) + Render (Backend) — Current Setup

### Frontend → Vercel

1. Push the repo to GitHub
2. Import the `frontend/` directory into Vercel (set root directory to `frontend`)
3. Add environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend.onrender.com/api/v1`
   - `NEXT_PUBLIC_SOCKET_URL` = `https://your-backend.onrender.com`
   - `BACKEND_API_URL` = `https://your-backend.onrender.com`
4. Deploy

### Backend → Render

1. Create a new Render account at [render.com](https://render.com)
2. Create a **Web Service** from the `backend/` directory
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add a **Redis** instance from Render's dashboard (free tier)
6. Add a **MongoDB** instance or use MongoDB Atlas (free tier)
7. Set environment variables:

```env
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/vedaai
REDIS_URL=redis://...render-redis-url...
CLIENT_ORIGIN=https://veda-ai-amber.vercel.app
JWT_SECRET=your-long-random-secret
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile
QUEUE_PREFIX=vedaai
```

### Local Fallback → zrok tunnel

When the Render backend is cold or unavailable, a local backend can be exposed via [zrok](https://zrok.io):

```bash
# Start backend locally
cd backend && npm run dev

# In another terminal, expose it via zrok
zrok share public localhost:4000
```

The current tunnel URL is `https://vediaai.share.zrok.io`. This is only active when the local machine is running.

---

## Option 2 — Docker Compose (Local / Staging)

The `backend/docker-compose.yml` defines three services: `api`, `mongo`, `redis`.

```bash
cd backend
docker-compose up --build
```

This starts:
- `api` — Express server on port `4000`
- `mongo` — MongoDB 7 on port `27017` with a persistent `mongo_data` volume
- `redis` — Redis 7-alpine on port `6379`

### Dockerfile (backend)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build        # tsc → dist/
EXPOSE 4000
CMD ["npm", "start"]     # node dist/server.js
```

### Frontend (separate)

```bash
cd frontend
npm run build
npm start
```

---

## Option 3 — Manual Production

### Backend

```bash
cd backend
npm run build

NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/vedaai
REDIS_URL=redis://:password@host:6379
CLIENT_ORIGIN=https://your-frontend.com
JWT_SECRET=a-very-long-random-secret-string
GROQ_API_KEY=gsk_...

npm start
```

### Frontend

```bash
cd frontend
NEXT_PUBLIC_API_URL=https://your-backend.com/api/v1
NEXT_PUBLIC_SOCKET_URL=https://your-backend.com
BACKEND_API_URL=https://your-backend.com
npm run build
npm start
```

---

## Environment Variables Reference

### Backend

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | yes | `development` | `development` \| `test` \| `production` |
| `PORT` | yes | `4000` | HTTP server port |
| `MONGODB_URI` | yes | — | MongoDB connection string |
| `REDIS_URL` | yes | — | Redis connection string (used by BullMQ + ioredis) |
| `CLIENT_ORIGIN` | yes | — | Frontend URL for CORS — comma-separated for multiple origins |
| `JWT_SECRET` | yes | — | Secret for signing JWTs (min 10 chars) |
| `JWT_EXPIRES_IN` | no | `7d` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | no | `30d` | Refresh token lifetime |
| `AI_PROVIDER` | no | `groq` | AI provider identifier |
| `GROQ_API_KEY` | yes | — | Groq API key from console.groq.com |
| `GROQ_MODEL` | no | `llama-3.3-70b-versatile` | Groq model to use |
| `QUEUE_PREFIX` | no | `vedaai` | BullMQ Redis key prefix |

### Frontend

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | yes | Backend REST API base URL (used client-side) |
| `NEXT_PUBLIC_SOCKET_URL` | yes | Backend Socket.IO URL (used client-side) — if set to localhost, the socket automatically routes through the Next.js proxy |
| `BACKEND_API_URL` | yes | Backend URL used server-side by Next.js API routes and rewrites |

> **Socket.IO proxy note:** When `NEXT_PUBLIC_SOCKET_URL` is a localhost URL but the frontend is served from a public domain (e.g. Vercel/ngrok), the `useSocket` hook automatically falls back to routing socket traffic through the Next.js `/socket.io` rewrite proxy to avoid browser loopback CORS restrictions.

---

## Production Checklist

- [ ] `NODE_ENV=production` is set on the backend
- [ ] `JWT_SECRET` is a long, random, unique string (32+ chars recommended)
- [ ] `CLIENT_ORIGIN` exactly matches the deployed frontend URL (no trailing slash); add multiple origins comma-separated if using both Vercel and a tunnel
- [ ] MongoDB has authentication enabled; URI includes credentials
- [ ] Redis has a password; `REDIS_URL` includes it (`redis://:password@host:port`)
- [ ] HTTPS is configured on both frontend and backend
- [ ] `GROQ_API_KEY` has sufficient quota
- [ ] `refreshToken` cookie `secure: true` is automatic when `NODE_ENV=production`
- [ ] Run `npm run seed` after first deploy if demo accounts are needed

---

## Scaling Notes

**Multiple backend instances (horizontal scaling)**

Socket.IO uses in-memory rooms by default. With multiple instances, a client connected to instance A won't receive events emitted by instance B. Fix: add `@socket.io/redis-adapter`:

```ts
import { createAdapter } from '@socket.io/redis-adapter';
const pubClient = new Redis(env.REDIS_URL);
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));
```

**Render free tier cold starts**

Render free tier spins down after 15 minutes of inactivity. The first request after a cold start takes ~30 seconds. To avoid this, use Render's paid tier or keep the service warm with a periodic ping (e.g. UptimeRobot).

**Worker concurrency**

Increase `concurrency` in `assignment.worker.ts` if Groq rate limits allow more parallel requests.

**Rate limiting**

Add `express-rate-limit` to the `/assignments` POST route to prevent Groq API quota exhaustion from a single user.

**MongoDB indexes**

Indexes on `externalId` and `teacherId` are defined in the Mongoose schemas with `autoIndex: true`. In production, consider setting `autoIndex: false` and running index creation as a migration step.
