import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { HttpError } from '@/utils/httpError.js';

export const validateBody = (schema: ZodTypeAny) => (req: Request, _res: Response, next: NextFunction) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return next(new HttpError(400, parsed.error.issues.map((issue) => issue.message).join(', ')));
  }

  req.body = parsed.data;
  next();
};