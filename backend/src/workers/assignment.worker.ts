import { Worker } from 'bullmq';
import { env } from '@/config.js';
import { assignmentService } from '@/services/assignment.service.js';

function redisConnection() {
  const url = new URL(env.REDIS_URL);
  return {
    host: url.hostname,
    port: Number(url.port) || 6379,
    password: url.password || undefined,
    db: url.pathname.length > 1 ? Number(url.pathname.slice(1)) : 0
  };
}
import { emitAssignmentEvent } from '@/websocket/socket.js';
import type { AssignmentCreateInput } from '@/types.js';
import { GenerationJobModel } from '@/models/job.model.js';

function emitProgress(assignmentExternalId: string, progress: number, message: string) {
  emitAssignmentEvent('generation.progress', { assignmentExternalId, progress, message });
}

export const assignmentWorker = new Worker(
  'assignments',
  async (job) => {
    const { assignmentExternalId, input } = job.data as { assignmentExternalId: string; input: AssignmentCreateInput };

    await GenerationJobModel.findOneAndUpdate(
      { jobId: String(job.id) },
      { state: 'PROCESSING', progress: 10, message: 'Starting generation' },
      { upsert: true }
    );

    emitAssignmentEvent('generation.started', { assignmentExternalId, jobId: String(job.id) });
    emitProgress(assignmentExternalId, 10, 'Starting generation');

    emitProgress(assignmentExternalId, 25, 'Building AI prompt');
    const assessment = await assignmentService.generateNow(input);

    emitProgress(assignmentExternalId, 45, 'Generating questions');

    await GenerationJobModel.findOneAndUpdate(
      { jobId: String(job.id) },
      { state: 'PROCESSING', progress: 75, message: 'Validating and saving' }
    );
    emitProgress(assignmentExternalId, 70, 'Validating output');
    emitProgress(assignmentExternalId, 90, 'Saving assessment');

    const assignment = await assignmentService.completeGeneration(assignmentExternalId, assessment);

    await GenerationJobModel.findOneAndUpdate(
      { jobId: String(job.id) },
      { state: 'COMPLETED', progress: 100, message: 'Generation completed' }
    );

    emitProgress(assignmentExternalId, 100, 'Generation completed');
    emitAssignmentEvent('generation.completed', { assignmentExternalId, assignment: assignment.toObject() });
    emitAssignmentEvent('pdf.generated', { assignmentExternalId, pdfUrl: assignment.pdfUrl ?? '' });

    return assessment;
  },
  {
    connection: redisConnection(),
    prefix: env.QUEUE_PREFIX,
    concurrency: 3
  }
);

assignmentWorker.on('failed', async (job, err) => {
  if (!job) return;
  const { assignmentExternalId } = job.data as { assignmentExternalId: string };
  await GenerationJobModel.findOneAndUpdate(
    { jobId: String(job.id) },
    { state: 'FAILED', message: err.message }
  );
  emitAssignmentEvent('generation.failed', { assignmentExternalId, error: err.message });
});
