import { GroupModel } from '@/models/group.model.js';
import { createId } from '@/utils/id.js';
import { HttpError } from '@/utils/httpError.js';

const INVITE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateInviteCode(): string {
  return Array.from({ length: 8 }, () =>
    INVITE_CHARS[Math.floor(Math.random() * INVITE_CHARS.length)]
  ).join('');
}

export class GroupService {
  async list(teacherId: string) {
    return GroupModel.find({ teacherId }).sort({ createdAt: -1 }).lean();
  }

  async create(
    teacherId: string,
    data: { name: string; subject: string; className: string; colorIdx?: number }
  ) {
    return GroupModel.create({
      externalId: createId('grp'),
      teacherId,
      name: data.name.trim(),
      subject: data.subject.trim(),
      className: data.className.trim(),
      colorIdx: data.colorIdx ?? 0,
      inviteCode: generateInviteCode()
    });
  }

  async get(externalId: string, teacherId: string) {
    const group = await GroupModel.findOne({ externalId, teacherId }).lean();
    if (!group) throw new HttpError(404, 'Group not found');
    return group;
  }

  async remove(externalId: string, teacherId: string) {
    const group = await GroupModel.findOneAndDelete({ externalId, teacherId });
    if (!group) throw new HttpError(404, 'Group not found');
    return { ok: true };
  }

  async assignPaper(
    externalId: string,
    teacherId: string,
    paper: { assignmentExternalId: string; assignmentTitle: string; dueDate?: string }
  ) {
    const group = await GroupModel.findOne({ externalId, teacherId });
    if (!group) throw new HttpError(404, 'Group not found');

    const already = group.assignedPapers.some(
      (p) => p.assignmentExternalId === paper.assignmentExternalId
    );
    if (already) throw new HttpError(409, 'This paper is already assigned to this group');

    group.assignedPapers.push({
      assignmentExternalId: paper.assignmentExternalId,
      assignmentTitle: paper.assignmentTitle,
      assignedAt: new Date(),
      dueDate: paper.dueDate ? new Date(paper.dueDate) : undefined
    });
    await group.save();
    return group.toObject();
  }

  async removePaper(externalId: string, teacherId: string, assignmentExternalId: string) {
    const group = await GroupModel.findOne({ externalId, teacherId });
    if (!group) throw new HttpError(404, 'Group not found');
    group.assignedPapers = (group.assignedPapers.filter(
      (p) => p.assignmentExternalId !== assignmentExternalId
    ) as unknown) as any;
    await group.save();
    return group.toObject();
  }

  async refreshInviteCode(externalId: string, teacherId: string) {
    const group = await GroupModel.findOneAndUpdate(
      { externalId, teacherId },
      { inviteCode: generateInviteCode() },
      { new: true }
    );
    if (!group) throw new HttpError(404, 'Group not found');
    return group.inviteCode as string;
  }
}

export const groupService = new GroupService();
