import { AssignmentDraftModel } from '@/models/draft.model.js';
import { AssignmentModel } from '@/models/assignment.model.js';
import { AssignmentVersionModel } from '@/models/version.model.js';
import { GenerationJobModel } from '@/models/job.model.js';
import { buildPrompt } from '@/services/promptBuilder.js';
import { GroqAiProvider } from '@/services/aiProvider.js';
import { generatePdfBuffer } from '@/services/pdfService.js';
import { assignmentsQueue } from '@/queues/assignment.queue.js';
import { createId } from '@/utils/id.js';
import type { AssignmentCreateInput, GeneratedAssessment } from '@/types.js';
import { HttpError } from '@/utils/httpError.js';

const aiProvider = new GroqAiProvider();

export class AssignmentService {
  async create(input: AssignmentCreateInput) {
    if (new Date(input.dueDate).getTime() <= Date.now()) {
      throw new HttpError(400, 'Due date must be in the future');
    }

    const externalId = createId('asmt');
    const assignment = await AssignmentModel.create({
      externalId,
      teacherId: input.teacherId,
      title: input.title,
      subject: input.subject,
      className: input.className,
      topic: input.topic,
      dueDate: new Date(input.dueDate),
      durationMinutes: input.durationMinutes,
      totalMarks: input.totalMarks,
      inputSource: input.inputSource,
      content: input.content ?? '',
      instructions: input.instructions ?? '',
      learningOutcomes: input.learningOutcomes ?? [],
      bloomTaxonomy: input.bloomTaxonomy ?? [],
      language: input.language ?? 'English',
      strictMode: input.strictMode ?? false,
      questionControls: input.questionControls,
      status: 'QUEUED'
    });

    const job = await assignmentsQueue.add('generate-assignment', {
      assignmentExternalId: externalId,
      input
    });

    await GenerationJobModel.create({
      jobId: String(job.id),
      assignmentExternalId: externalId,
      state: 'QUEUED',
      progress: 0,
      message: 'Queued for generation'
    });

    assignment.generationJobId = String(job.id);
    await assignment.save();

    await AssignmentDraftModel.create({
      teacherId: input.teacherId,
      assignmentExternalId: externalId,
      payload: input
    });

    return assignment;
  }

  async generateNow(input: AssignmentCreateInput) {
    const prompt = buildPrompt(input);
    const assessment = await aiProvider.generateAssessment(prompt);
    return assessment;
  }

  async regenerate(assignmentExternalId: string, teacherId: string) {
    const assignment = await AssignmentModel.findOne({ externalId: assignmentExternalId, teacherId });
    if (!assignment) {
      throw new HttpError(404, 'Assignment not found');
    }

    const draft = await AssignmentDraftModel.findOne({ assignmentExternalId, teacherId });
    if (!draft) {
      throw new HttpError(404, 'Saved draft not found');
    }

    const input = {
      ...(draft.payload as AssignmentCreateInput),
      teacherId
    } as AssignmentCreateInput;

    const job = await assignmentsQueue.add('generate-assignment', {
      assignmentExternalId,
      input
    });

    await GenerationJobModel.create({
      jobId: String(job.id),
      assignmentExternalId,
      state: 'QUEUED',
      progress: 0,
      message: 'Queued for generation'
    });

    assignment.status = 'REGENERATING';
    assignment.generationJobId = String(job.id);
    await assignment.save();

    return { assignmentExternalId, jobId: String(job.id), state: 'QUEUED' as const };
  }

  async completeGeneration(assignmentExternalId: string, assessment: GeneratedAssessment) {
    const assignment = await AssignmentModel.findOne({ externalId: assignmentExternalId });
    if (!assignment) {
      throw new HttpError(404, 'Assignment not found');
    }

    assignment.generatedAssessment = assessment;
    assignment.status = 'COMPLETED';
    assignment.version += 1;
    assignment.pdfUrl = `/api/v1/assignments/${assignmentExternalId}/export/pdf`;
    await assignment.save();

    await AssignmentVersionModel.create({
      assignmentExternalId,
      version: assignment.version,
      generatedAssessment: assessment,
      notes: 'Generation completed'
    });

    return assignment;
  }

  async exportPdf(assignmentExternalId: string) {
    const assignment = await AssignmentModel.findOne({ externalId: assignmentExternalId });
    if (!assignment || !assignment.generatedAssessment) {
      throw new HttpError(404, 'Generated assessment not found');
    }

    return generatePdfBuffer(assignment.generatedAssessment as GeneratedAssessment, {
      title: assignment.title,
      subject: assignment.subject,
      className: assignment.className,
      duration: assignment.durationMinutes,
      totalMarks: assignment.totalMarks
    });
  }
}

export const assignmentService = new AssignmentService();