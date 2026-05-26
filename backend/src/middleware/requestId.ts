import type { NextFunction, Request, Response } from 'express';
import { createId } from '@/utils/id.js';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = (req.header('x-request-id') || createId('req')).toString();
  res.setHeader('x-request-id', requestId);
  req.headers['x-request-id'] = requestId;
  next();
}