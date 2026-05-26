import { Queue } from 'bullmq';
import { env } from '@/config.js';

function redisConnection() {
  const url = new URL(env.REDIS_URL);
  return {
    host: url.hostname,
    port: Number(url.port) || 6379,
    password: url.password || undefined,
    db: url.pathname.length > 1 ? Number(url.pathname.slice(1)) : 0
  };
}

export const assignmentsQueue = new Queue('assignments', {
  connection: redisConnection(),
  prefix: env.QUEUE_PREFIX
});
