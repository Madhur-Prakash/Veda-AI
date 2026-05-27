import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.js';
import { validateBody } from '@/middleware/validate.js';
import { requireAuth } from '@/middleware/auth.js';
import { createRateLimitMiddleware } from '@/middleware/rateLimit.js';
import {
  createAssignmentSchema,
  regenerateAssignmentSchema,
  registerSchema,
  loginSchema
} from '@/api/validators.js';
import {
  createAssignment,
  exportPdf,
  getAssignment,
  getDashboardSummary,
  listAssignments,
  regenerateAssignment
} from '@/api/assignment.controller.js';
import { register, login, refresh, logout, getMe } from '@/api/auth.controller.js';

export const apiRouter = Router();
const generationRateLimit = createRateLimitMiddleware({
  keyPrefix: 'groq:generation',
  limit: 5,
  windowMs: 10 * 60 * 1000, // 10 minutes
  message: 'Too many assessment generation requests.'
});

apiRouter.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'vedaai-backend' });
});

// Auth routes (public)
apiRouter.post('/auth/register', validateBody(registerSchema), asyncHandler(register));
apiRouter.post('/auth/login', validateBody(loginSchema), asyncHandler(login));
apiRouter.post('/auth/refresh', asyncHandler(refresh));
apiRouter.post('/auth/logout', requireAuth, asyncHandler(logout));
apiRouter.get('/auth/me', requireAuth, asyncHandler(getMe));

// Protected assignment routes
apiRouter.get('/dashboard/summary', requireAuth, asyncHandler(getDashboardSummary));
apiRouter.get('/assignments', requireAuth, asyncHandler(listAssignments));
apiRouter.get('/assignments/:id', requireAuth, asyncHandler(getAssignment));
apiRouter.post('/assignments', requireAuth, generationRateLimit, validateBody(createAssignmentSchema), asyncHandler(createAssignment));
apiRouter.post('/assignments/:id/regenerate', requireAuth, generationRateLimit, validateBody(regenerateAssignmentSchema), asyncHandler(regenerateAssignment));
apiRouter.get('/assignments/:id/export/pdf', requireAuth, asyncHandler(exportPdf));
