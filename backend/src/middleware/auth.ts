import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/services/auth.service.js';

export interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string; role: string };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: { message: 'Missing authorization header', statusCode: 401 } });
  }

  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    (req as AuthenticatedRequest).user = payload;
    next();
  } catch {
    res.status(401).json({ error: { message: 'Invalid or expired token', statusCode: 401 } });
  }
}
