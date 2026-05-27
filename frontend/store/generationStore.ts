'use client';

import { create } from 'zustand';
import type { Assignment } from '@/types';
import { useNotificationStore } from '@/store/notificationStore';

export type GenerationStatus = 'idle' | 'queued' | 'processing' | 'completed' | 'failed';

interface GenerationState {
  status: GenerationStatus;
  progress: number;
  message: string;
  assignmentId: string | null;   // the assignment currently being tracked
  completedAssignment: Assignment | null;
  error: string | null;
  setQueued: (assignmentId: string, notificationKey?: string) => void;
  setProgress: (progress: number, message: string) => void;
  setCompleted: (assignment: Assignment, notificationKey?: string) => void;
  setFailed: (error: string) => void;
  reset: () => void;
}

export const useGenerationStore = create<GenerationState>((set) => ({
  status: 'idle',
  progress: 0,
  message: '',
  assignmentId: null,
  completedAssignment: null,
  error: null,

  setQueued: (assignmentId, notificationKey) => {
    useNotificationStore.getState().addNotification({
      dedupeKey: notificationKey ?? `queued:${assignmentId}`,
      title: 'Assessment queued',
      body: 'Your paper generation has been queued and will update here as it progresses.',
      href: `/generation-status?id=${assignmentId}`,
      kind: 'queued'
    });

    set({ status: 'queued', assignmentId, progress: 0, message: 'Queued for generation', completedAssignment: null, error: null });
  },
  setProgress: (progress, message) => set({ status: 'processing', progress, message, completedAssignment: null, error: null }),
  setCompleted: (assignment, notificationKey) => {
    useNotificationStore.getState().addNotification({
      dedupeKey: notificationKey ?? `generation:${assignment.externalId}:${assignment.generationJobId ?? assignment.version}`,
      title: 'Assessment ready',
      body: `${assignment.title} has finished generating. Open the assessment to review or download it.`,
      href: `/assessment/${assignment.externalId}`,
      kind: 'completed'
    });

    set({ status: 'completed', progress: 100, message: 'Generation completed', completedAssignment: assignment, error: null });
  },
  setFailed: (error) => set({ status: 'failed', error, completedAssignment: null }),
  reset: () => set({ status: 'idle', progress: 0, message: '', assignmentId: null, completedAssignment: null, error: null })
}));
