import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/services/auth.service.js';

export interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string; role: string };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Prefer httpOnly cookie; fall back to Bearer header for API clients / tests
  const cookieToken = req.cookies?.accessToken as string | undefined;
  const header = req.headers.authorization;
  const token = cookieToken ?? (header?.startsWith('Bearer ') ? header.slice(7) : undefined);

  if (!token) {
    return res.status(401).json({ error: { message: 'Not authenticated', statusCode: 401 } });
  }

  try {
    const payload = verifyToken(token);
    (req as AuthenticatedRequest).user = payload;
    next();
  } catch {
    res.status(401).json({ error: { message: 'Invalid or expired token', statusCode: 401 } });
  }
}
