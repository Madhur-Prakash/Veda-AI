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

function sleep(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }

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
    await sleep(400);

    emitProgress(assignmentExternalId, 20, 'Building AI prompt');
    await sleep(600);

    // Emit "Generating questions" before the AI call so the step is visible during the wait
    emitProgress(assignmentExternalId, 40, 'Generating questions');
    const assessment = await assignmentService.generateNow(input);

    // Space out the remaining steps so each one is visible on the frontend
    await sleep(700);
    await GenerationJobModel.findOneAndUpdate(
      { jobId: String(job.id) },
      { state: 'PROCESSING', progress: 70, message: 'Validating output' }
    );
    emitProgress(assignmentExternalId, 70, 'Validating output');

    await sleep(800);
    emitProgress(assignmentExternalId, 90, 'Saving assessment');

    const assignment = await assignmentService.completeGeneration(assignmentExternalId, assessment);

    await sleep(600);
    await GenerationJobModel.findOneAndUpdate(
      { jobId: String(job.id) },
      { state: 'COMPLETED', progress: 100, message: 'Generation completed' }
    );
    emitProgress(assignmentExternalId, 100, 'Generation completed');

    await sleep(300);
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
