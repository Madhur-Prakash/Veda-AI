import type { Request, Response } from 'express';
import { authService } from '@/services/auth.service.js';

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 30 * 24 * 60 * 60 * 1000
};

export async function register(req: Request, res: Response) {
  const { name, email, password, school } = req.body;
  const result = await authService.register(name, email, password, school);
  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTS);
  res.status(201).json({ data: { user: result.user, accessToken: result.accessToken } });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTS);
  res.json({ data: { user: result.user, accessToken: result.accessToken } });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.refreshToken as string | undefined;
  if (!token) return res.status(401).json({ error: { message: 'No refresh token', statusCode: 401 } });
  const result = await authService.refresh(token);
  res.json({ data: result });
}

export async function logout(req: Request, res: Response) {
  const user = (req as Request & { user?: { userId: string } }).user;
  if (user) await authService.logout(user.userId);
  res.clearCookie('refreshToken');
  res.json({ data: { ok: true } });
}

export async function getMe(req: Request, res: Response) {
  const user = (req as Request & { user?: { userId: string } }).user;
  if (!user) return res.status(401).json({ error: { message: 'Unauthorized', statusCode: 401 } });
  const profile = await authService.getMe(user.userId);
  res.json({ data: profile });
}
