import type { Request, Response } from 'express';
import { groupService } from '@/services/group.service.js';

function uid(req: Request): string {
  const user = (req as Request & { user?: { userId: string } }).user;
  if (!user) throw new Error('Unauthorized');
  return user.userId;
}

export async function listGroups(req: Request, res: Response) {
  const groups = await groupService.list(uid(req));
  res.json({ data: groups });
}

export async function createGroup(req: Request, res: Response) {
  const { name, subject, className, colorIdx } = req.body as {
    name: string; subject: string; className: string; colorIdx?: number;
  };
  const data: { name: string; subject: string; className: string; colorIdx?: number } = {
    name: (name ?? '').toString().trim(),
    subject: (subject ?? '').toString().trim(),
    className: (className ?? '').toString().trim(),
    ...(colorIdx !== undefined ? { colorIdx: Number(colorIdx) } : {})
  };
  const group = await groupService.create(uid(req), data);
  res.status(201).json({ data: group });
}

export async function getGroup(req: Request, res: Response) {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) return res.status(400).json({ error: { message: 'Missing group id', statusCode: 400 } });
  const group = await groupService.get(id, uid(req));
  res.json({ data: group });
}

export async function deleteGroup(req: Request, res: Response) {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) return res.status(400).json({ error: { message: 'Missing group id', statusCode: 400 } });
  const result = await groupService.remove(id, uid(req));
  res.json({ data: result });
}

export async function assignPaper(req: Request, res: Response) {
  const { assignmentExternalId, assignmentTitle, dueDate } = req.body as {
    assignmentExternalId: string; assignmentTitle: string; dueDate?: string;
  };
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) return res.status(400).json({ error: { message: 'Missing group id', statusCode: 400 } });
  const paper: { assignmentExternalId: string; assignmentTitle: string; dueDate?: string } = {
    assignmentExternalId: (assignmentExternalId ?? '').toString(),
    assignmentTitle: (assignmentTitle ?? '').toString(),
    ...(dueDate ? { dueDate: dueDate.toString() } : {})
  };
  const group = await groupService.assignPaper(id, uid(req), paper);
  res.json({ data: group });
}

export async function removePaper(req: Request, res: Response) {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) return res.status(400).json({ error: { message: 'Missing group id', statusCode: 400 } });
  const rawAid = req.params.assignmentId;
  const assignmentId = Array.isArray(rawAid) ? rawAid[0] : rawAid;
  if (!assignmentId) return res.status(400).json({ error: { message: 'Missing assignment id', statusCode: 400 } });
  const group = await groupService.removePaper(id, uid(req), assignmentId);
  res.json({ data: group });
}

export async function refreshInvite(req: Request, res: Response) {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) return res.status(400).json({ error: { message: 'Missing group id', statusCode: 400 } });
  const inviteCode = await groupService.refreshInviteCode(id, uid(req));
  res.json({ data: { inviteCode } });
}
