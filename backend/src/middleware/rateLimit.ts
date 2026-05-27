import type { NextFunction, Request, Response } from 'express';
import { redis } from '@/services/redis.js';
import { HttpError } from '@/utils/httpError.js';

type RateLimitOptions = {
  keyPrefix: string;
  limit: number;
  windowMs: number;
  message: string;
  keyGenerator?: (req: Request) => string;
};

function getRequestKey(req: Request) {
  const authenticatedReq = req as Request & { user?: { userId?: string } };
  return authenticatedReq.user?.userId ?? req.ip ?? 'anonymous';
}

function getRetryAfterSeconds(ttlMs: number, windowMs: number) {
  const fallbackSeconds = Math.ceil(windowMs / 1000);
  if (ttlMs <= 0) {
    return fallbackSeconds;
  }

  return Math.max(1, Math.ceil(ttlMs / 1000));
}

export function createRateLimitMiddleware(options: RateLimitOptions) {
  return async function rateLimit(req: Request, res: Response, next: NextFunction) {
    try {
      const keyId = options.keyGenerator?.(req) ?? getRequestKey(req);
      const key = `${options.keyPrefix}:${keyId}`;

      const count = await redis.incr(key);
      if (count === 1) {
        await redis.pexpire(key, options.windowMs);
      }

      const ttlMs = await redis.pttl(key);
      const retryAfterSeconds = getRetryAfterSeconds(ttlMs, options.windowMs);

      res.setHeader('X-RateLimit-Limit', String(options.limit));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, options.limit - count)));
      res.setHeader('X-RateLimit-Reset', String(Math.ceil((Date.now() + Math.max(ttlMs, 0)) / 1000)));

      if (count > options.limit) {
        res.setHeader('Retry-After', String(retryAfterSeconds));
        return next(new HttpError(429, options.message, { details: { retryAfterSeconds } }));
      }

      return next();
    } catch {
      return next();
    }
  };
}