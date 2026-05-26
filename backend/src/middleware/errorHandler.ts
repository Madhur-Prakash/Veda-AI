import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '@/utils/httpError.js';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const statusCode = err instanceof HttpError ? err.statusCode : 500;
  const message = err instanceof Error ? err.message : 'Internal server error';

  res.status(statusCode).json({
    error: {
      message,
      statusCode
    }
  });
}