import { Server } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import { env } from '@/config.js';
import { GenerationJobModel } from '@/models/job.model.js';
import { AssignmentModel } from '@/models/assignment.model.js';

export type AssignmentEventName =
  | 'assignment.created'
  | 'generation.started'
  | 'generation.progress'
  | 'generation.completed'
  | 'generation.failed'
  | 'pdf.generated';

let io: Server | null = null;

function parseAllowedOrigins(value: string) {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function initSocket(server: HttpServer) {
  io = new Server(server, {
    path: '/socket.io/',
    cors: { origin: parseAllowedOrigins(env.CLIENT_ORIGIN), credentials: true }
  });

  io.on('connection', (socket) => {
    socket.emit('connected', { socketId: socket.id });

    socket.on('join_assignment', async (assignmentId: string) => {
      socket.join(`assignment:${assignmentId}`);

      const job = await GenerationJobModel.findOne({ assignmentExternalId: assignmentId }).sort({ createdAt: -1 }).lean();
      if (!job) return;

      if (job.state === 'COMPLETED') {
        const assignment = await AssignmentModel.findOne({ externalId: assignmentId }).lean();
        if (assignment) {
          socket.emit('generation.completed', { assignmentExternalId: assignmentId, assignment });
        }
        return;
      }

      if (job.state === 'FAILED') {
        socket.emit('generation.failed', { assignmentExternalId: assignmentId, error: job.message || 'Generation failed' });
        return;
      }

      socket.emit('generation.progress', {
        assignmentExternalId: assignmentId,
        progress: job.progress ?? 0,
        message: job.message || 'Queued for generation'
      });
    });

    socket.on('leave_assignment', (assignmentId: string) => {
      socket.leave(`assignment:${assignmentId}`);
    });
  });

  return io;
}

export function emitAssignmentEvent(event: AssignmentEventName, payload: Record<string, unknown> & { assignmentExternalId: string }) {
  if (!io) return;
  const room = `assignment:${payload.assignmentExternalId}`;
  io.to(room).emit(event, payload);
  io.emit(event, payload);
}

export function getSocketServer() {
  return io;
}
