import type { NextFunction, Request, Response } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const reqId = (req.headers['x-request-id'] || '').toString();
    const time = new Date().toISOString();
    console.log(`${time}  ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms  reqId=${reqId}`);
  });

  next();
}
