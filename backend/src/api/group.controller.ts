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
  const group = await groupService.create(uid(req), { name, subject, className, colorIdx });
  res.status(201).json({ data: group });
}

export async function getGroup(req: Request, res: Response) {
  const group = await groupService.get(req.params.id, uid(req));
  res.json({ data: group });
}

export async function deleteGroup(req: Request, res: Response) {
  const result = await groupService.remove(req.params.id, uid(req));
  res.json({ data: result });
}

export async function assignPaper(req: Request, res: Response) {
  const { assignmentExternalId, assignmentTitle, dueDate } = req.body as {
    assignmentExternalId: string; assignmentTitle: string; dueDate?: string;
  };
  const group = await groupService.assignPaper(req.params.id, uid(req), {
    assignmentExternalId, assignmentTitle, dueDate
  });
  res.json({ data: group });
}

export async function removePaper(req: Request, res: Response) {
  const group = await groupService.removePaper(
    req.params.id, uid(req), req.params.assignmentId
  );
  res.json({ data: group });
}

export async function refreshInvite(req: Request, res: Response) {
  const inviteCode = await groupService.refreshInviteCode(req.params.id, uid(req));
  res.json({ data: { inviteCode } });
}
