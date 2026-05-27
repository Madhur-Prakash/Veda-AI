import http from 'node:http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from '@/config.js';
import { connectMongo } from '@/services/mongo.js';
import { connectRedis } from '@/services/redis.js';
import { apiRouter } from '@/api/routes.js';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler.js';
import { requestIdMiddleware } from '@/middleware/requestId.js';
import { requestLogger } from '@/middleware/logger.js';
import { initSocket } from '@/websocket/socket.js';
import '@/workers/assignment.worker.js';

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestIdMiddleware);
app.use(requestLogger);

app.get('/', (_req, res) => {
  res.json({ name: 'VedaAI Backend', version: '1.0.0' });
});

app.use('/api/v1', apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

const port = env.PORT;

async function bootstrap() {
  await connectMongo();
  await connectRedis();
  initSocket(server);

  server.listen(port, () => {
    console.log(`VedaAI backend listening on port ${port}`);
  });
}

void bootstrap();
