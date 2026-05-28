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

const MAX_GROQ_ATTEMPTS = 5;

function pickDifficulty(easy: number, medium: number, hard: number, index: number, total: number) {
  const totalWeight = easy + medium + hard;
  if (totalWeight <= 0) return 'Medium' as const;

  const slot = ((index % Math.max(1, total)) / Math.max(1, total)) * totalWeight;
  if (slot < easy) return 'Easy' as const;
  if (slot < easy + medium) return 'Medium' as const;
  return 'Hard' as const;
}

function buildFallbackQuestion(input: AssignmentCreateInput, type: AssignmentCreateInput['questionControls'][number]['type'], sectionIndex: number, questionIndex: number, difficulty: 'Easy' | 'Medium' | 'Hard', marks: number) {
  const topic = input.topic.trim();
  const subject = input.subject.trim();
  const ordinal = questionIndex + 1;
  const sectionLabel = String.fromCharCode(65 + sectionIndex);

  switch (type) {
    case 'MCQ':
      return {
        id: `fb-${sectionIndex + 1}-${ordinal}`,
        question: `MCQ ${ordinal}: Which statement best reflects a core idea from ${topic} in ${subject}?`,
        difficulty,
        marks,
        type,
        answer_key: 'Hardcoded fallback answer. Review and replace if needed.',
        blooms_level: 'Understand',
        estimated_time: '1 min'
      };
    case 'True False':
      return {
        id: `fb-${sectionIndex + 1}-${ordinal}`,
        question: `True or False ${ordinal}: In Section ${sectionLabel}, a key concept from ${topic} can be applied in real-world situations.`,
        difficulty,
        marks,
        type,
        answer_key: 'Hardcoded fallback answer. Review and replace if needed.',
        blooms_level: 'Understand',
        estimated_time: '1 min'
      };
    case 'Short':
      return {
        id: `fb-${sectionIndex + 1}-${ordinal}`,
        question: `Short answer ${ordinal}: Explain one important concept related to ${topic} and give one classroom example.`,
        difficulty,
        marks,
        type,
        answer_key: 'Hardcoded fallback answer. Review and replace if needed.',
        blooms_level: 'Apply',
        estimated_time: '2 min'
      };
    case 'Long':
      return {
        id: `fb-${sectionIndex + 1}-${ordinal}`,
        question: `Long answer ${ordinal}: Describe how ${topic} is used or observed in ${subject}, and explain why it matters.`,
        difficulty,
        marks,
        type,
        answer_key: 'Hardcoded fallback answer. Review and replace if needed.',
        blooms_level: 'Analyze',
        estimated_time: '4 min'
      };
    case 'Case Study':
      return {
        id: `fb-${sectionIndex + 1}-${ordinal}`,
        question: `Case study ${ordinal}: Read a short classroom scenario about ${topic}, identify the problem, and answer the follow-up questions.`,
        difficulty,
        marks,
        type,
        answer_key: 'Hardcoded fallback answer. Review and replace if needed.',
        blooms_level: 'Analyze',
        estimated_time: '4 min'
      };
  }
}

function buildFallbackAssessment(input: AssignmentCreateInput) {
  const sections = input.questionControls.map((control, sectionIndex) => {
    const questionCount = Math.max(control.count, 5);
    const questions = Array.from({ length: questionCount }, (_, questionIndex) =>
      buildFallbackQuestion(
        input,
        control.type,
        sectionIndex,
        questionIndex,
        pickDifficulty(
          control.difficultyDistribution.easy,
          control.difficultyDistribution.medium,
          control.difficultyDistribution.hard,
          questionIndex,
          questionCount
        ),
        control.marks
      )
    );

    return {
      title: `Section ${String.fromCharCode(65 + sectionIndex)} - ${control.type}`,
      instruction:
        sectionIndex === 0
          ? 'Hardcoded fallback response. Groq failed after 5 attempts, so this paper was generated from a deterministic template with expanded question coverage.'
          : 'Answer all questions carefully.',
      questions
    };
  });

  return { sections };
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
    await sleep(400);

    emitProgress(assignmentExternalId, 20, 'Building AI prompt');
    await sleep(600);

    // Emit "Generating questions" before the AI call so the step is visible during the wait
    let assessment = null as Awaited<ReturnType<typeof assignmentService.generateNow>> | null;
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= MAX_GROQ_ATTEMPTS; attempt += 1) {
      const message = attempt === 1
        ? 'Generating questions'
        : `Groq retry ${attempt}/${MAX_GROQ_ATTEMPTS}`;

      await GenerationJobModel.findOneAndUpdate(
        { jobId: String(job.id) },
        {
          state: 'PROCESSING',
          progress: 40,
          message,
          retryCount: attempt - 1,
          fallbackUsed: false
        }
      );
      emitProgress(assignmentExternalId, 40, message);

      try {
        assessment = await assignmentService.generateNow(input);
        break;
      } catch (error) {
        lastError = error;

        if (attempt === MAX_GROQ_ATTEMPTS) {
          assessment = buildFallbackAssessment(input);
          const fallbackMessage = 'Groq failed 5 times. Using a hardcoded fallback paper template.';
          await GenerationJobModel.findOneAndUpdate(
            { jobId: String(job.id) },
            {
              state: 'PROCESSING',
              progress: 40,
              message: fallbackMessage,
              retryCount: MAX_GROQ_ATTEMPTS,
              fallbackUsed: true
            }
          );
          emitProgress(assignmentExternalId, 40, fallbackMessage);
          break;
        }

        const retryMessage = `Groq attempt ${attempt}/${MAX_GROQ_ATTEMPTS} failed. Retrying...`;
        await GenerationJobModel.findOneAndUpdate(
          { jobId: String(job.id) },
          {
            state: 'PROCESSING',
            progress: 40,
            message: retryMessage,
            retryCount: attempt,
            fallbackUsed: false
          }
        );
        emitProgress(assignmentExternalId, 40, retryMessage);
        await sleep(900 + (attempt - 1) * 300);
      }
    }

    if (!assessment) {
      throw lastError instanceof Error ? lastError : new Error('Failed to generate assessment');
    }

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
