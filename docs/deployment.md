# Deployment Guide

## Option 1 — Docker Compose (Recommended for Local / Staging)

The `backend/docker-compose.yml` defines three services: `api`, `mongo`, `redis`.

### Start everything

```bash
cd backend
docker-compose up --build
```

This builds the backend image using `backend/Dockerfile` and starts:
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

The frontend is not in the Docker Compose file. Deploy it separately:

```bash
cd frontend
npm run build
npm start
```

Or deploy to Vercel (see Option 3).

---

## Option 2 — Manual Production

### Backend

```bash
cd backend
npm run build          # compiles TypeScript → dist/

# Set environment variables (or use a .env file)
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/vedaai
REDIS_URL=redis://:password@host:6379
CLIENT_ORIGIN=https://your-frontend.com
JWT_SECRET=a-very-long-random-secret-string
GROQ_API_KEY=gsk_...

npm start              # node dist/server.js
```

### Frontend

```bash
cd frontend
NEXT_PUBLIC_API_URL=https://your-backend.com/api/v1
NEXT_PUBLIC_SOCKET_URL=https://your-backend.com
npm run build
npm start
```

---

## Option 3 — Vercel (Frontend) + Railway (Backend)

### Frontend → Vercel

1. Push the repo to GitHub
2. Import the `frontend/` directory into Vercel (set root directory to `frontend`)
3. Add environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend.railway.app/api/v1`
   - `NEXT_PUBLIC_SOCKET_URL` = `https://your-backend.railway.app`
4. Deploy

### Backend → Railway

1. Create a new Railway project
2. Add a service from the `backend/` directory (Railway detects the Dockerfile)
3. Add MongoDB and Redis plugins from the Railway marketplace
4. Set environment variables (Railway injects `MONGODB_URI` and `REDIS_URL` automatically from plugins)
5. Add remaining vars: `CLIENT_ORIGIN`, `JWT_SECRET`, `GROQ_API_KEY`
6. Deploy

---

## Environment Variables Reference

### Backend

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | yes | `development` | `development` \| `test` \| `production` |
| `PORT` | yes | `4000` | HTTP server port |
| `MONGODB_URI` | yes | — | MongoDB connection string |
| `REDIS_URL` | yes | — | Redis connection string (used by BullMQ + ioredis) |
| `CLIENT_ORIGIN` | yes | — | Frontend URL for CORS (exact match, no trailing slash) |
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
| `NEXT_PUBLIC_API_URL` | yes | Backend REST API base URL |
| `NEXT_PUBLIC_SOCKET_URL` | yes | Backend WebSocket URL (Socket.IO) |

---

## Production Checklist

- [ ] `NODE_ENV=production` is set on the backend
- [ ] `JWT_SECRET` is a long, random, unique string (32+ chars recommended)
- [ ] `CLIENT_ORIGIN` exactly matches the deployed frontend URL (no trailing slash)
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

**Worker concurrency**

Increase `concurrency` in `assignment.worker.ts` if Groq rate limits allow more parallel requests.

**Rate limiting**

Add `express-rate-limit` to the `/assignments` POST route to prevent Groq API quota exhaustion from a single user.

**MongoDB indexes**

Indexes on `externalId` and `teacherId` are defined in the Mongoose schemas with `autoIndex: true`. They are created automatically on first connection. In production, consider setting `autoIndex: false` and running index creation as a migration step.
