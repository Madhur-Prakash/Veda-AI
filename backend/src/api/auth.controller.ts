import type { Request, Response } from 'express';
import { authService } from '@/services/auth.service.js';

const COOKIE_BASE = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

const REFRESH_COOKIE_OPTS = { ...COOKIE_BASE, maxAge: 30 * 24 * 60 * 60 * 1000 };
const ACCESS_COOKIE_OPTS  = { ...COOKIE_BASE, maxAge: 15 * 60 * 1000 }; // 15 min

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('accessToken',  accessToken,  ACCESS_COOKIE_OPTS);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
}

export async function register(req: Request, res: Response) {
  const { name, email, password, school } = req.body;
  const result = await authService.register(name, email, password, school);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  res.status(201).json({ data: { user: result.user } });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  res.json({ data: { user: result.user } });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.refreshToken as string | undefined;
  if (!token) return res.status(401).json({ error: { message: 'No refresh token', statusCode: 401 } });
  const result = await authService.refresh(token);
  res.cookie('accessToken', result.accessToken, ACCESS_COOKIE_OPTS);
  res.json({ data: { user: result.user } });
}

export async function logout(req: Request, res: Response) {
  const user = (req as Request & { user?: { userId: string } }).user;
  if (user) await authService.logout(user.userId);
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ data: { ok: true } });
}

export async function getMe(req: Request, res: Response) {
  const user = (req as Request & { user?: { userId: string } }).user;
  if (!user) return res.status(401).json({ error: { message: 'Unauthorized', statusCode: 401 } });
  const profile = await authService.getMe(user.userId);
  res.json({ data: profile });
}

export async function updateMe(req: Request, res: Response) {
  const user = (req as Request & { user?: { userId: string } }).user;
  if (!user) return res.status(401).json({ error: { message: 'Unauthorized', statusCode: 401 } });
  const { name, school } = req.body as { name?: string; school?: string };
  const updated = await authService.updateProfile(user.userId, { name, school });
  res.json({ data: updated });
}
