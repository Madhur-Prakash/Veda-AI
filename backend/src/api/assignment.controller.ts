import type { Request, Response } from 'express';
import { assignmentService } from '@/services/assignment.service.js';
import { AssignmentModel } from '@/models/assignment.model.js';
import { GenerationJobModel } from '@/models/job.model.js';
import type { AuthenticatedRequest } from '@/middleware/auth.js';

export async function createAssignment(req: Request, res: Response) {
  const { userId } = (req as AuthenticatedRequest).user;
  const assignment = await assignmentService.create({ ...req.body, teacherId: userId });
  res.status(201).json({ data: assignment });
}

export async function listAssignments(req: Request, res: Response) {
  const { userId } = (req as AuthenticatedRequest).user;
  const items = await AssignmentModel.find({ teacherId: userId }).sort({ createdAt: -1 }).lean();
  res.json({ data: items });
}

export async function getAssignment(req: Request, res: Response) {
  const { userId } = (req as AuthenticatedRequest).user;
  const assignment = await AssignmentModel.findOne({ externalId: req.params.id, teacherId: userId }).lean();
  if (!assignment) return res.status(404).json({ error: { message: 'Assignment not found', statusCode: 404 } });
  res.json({ data: assignment });
}

export async function getDashboardSummary(req: Request, res: Response) {
  const { userId } = (req as AuthenticatedRequest).user;
  const [totalAssignments, completedAssignments, processingJobs] = await Promise.all([
    AssignmentModel.countDocuments({ teacherId: userId }),
    AssignmentModel.countDocuments({ teacherId: userId, status: 'COMPLETED' }),
    GenerationJobModel.countDocuments({ state: 'PROCESSING' })
  ]);

  res.json({
    data: {
      totalAssignments,
      completedAssignments,
      processingJobs,
      successRate: totalAssignments === 0 ? 0 : Math.round((completedAssignments / totalAssignments) * 100)
    }
  });
}

export async function regenerateAssignment(req: Request, res: Response) {
  const { userId } = (req as AuthenticatedRequest).user;
  const rawId = req.params.id;
  const assignmentId = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!assignmentId) {
    return res.status(400).json({ error: { message: 'Missing assignment id', statusCode: 400 } });
  }
  const result = await assignmentService.regenerate(assignmentId, userId);
  res.status(202).json({ data: result });
}

export async function exportPdf(req: Request, res: Response) {
  const { userId } = (req as AuthenticatedRequest).user;
  const assignment = await AssignmentModel.findOne({ externalId: req.params.id, teacherId: userId });
  if (!assignment) return res.status(404).json({ error: { message: 'Assignment not found', statusCode: 404 } });

  const buffer = await assignmentService.exportPdf(req.params['id'] as string);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="assignment-${req.params.id}.pdf"`);
  res.send(buffer);
}
