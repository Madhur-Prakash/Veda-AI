'use client';

import { create } from 'zustand';
import type { Assignment, AssignmentCreatePayload, DashboardSummary } from '@/types';
import { assignmentApi } from '@/lib/api';

function getApiErrorMessage(err: unknown, fallback: string) {
  const errorResponse = err as {
    response?: {
      status?: number;
      data?: {
        error?: {
          message?: string;
          details?: {
            retryAfterSeconds?: number;
          };
        };
      };
    };
  };

  const apiError = errorResponse.response?.data?.error;
  if (!apiError?.message) {
    return fallback;
  }

  if (errorResponse.response?.status === 429) {
    const retryAfterSeconds = apiError.details?.retryAfterSeconds;
    if (retryAfterSeconds) {
      const retryMinutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
      return `${apiError.message} Please try again in ${retryMinutes === 1 ? '1 minute' : `${retryMinutes} minutes`}.`;
    }
  }

  return apiError.message;
}

interface AssignmentState {
  assignments: Assignment[];
  currentAssignment: Assignment | null;
  dashboard: DashboardSummary | null;
  isLoading: boolean;
  error: string | null;
  fetchAssignments: () => Promise<void>;
  fetchAssignment: (id: string) => Promise<void>;
  createAssignment: (payload: AssignmentCreatePayload) => Promise<Assignment>;
  regenerate: (id: string, notes?: string) => Promise<{ assignmentExternalId: string; jobId: string; state: string }>;
  fetchDashboard: () => Promise<void>;
  setCurrentAssignment: (a: Assignment | null) => void;
}

export const useAssignmentStore = create<AssignmentState>((set) => ({
  assignments: [],
  currentAssignment: null,
  dashboard: null,
  isLoading: false,
  error: null,

  fetchAssignments: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await assignmentApi.list();
      set({ assignments: data.data, isLoading: false });
    } catch {
      set({ error: 'Failed to fetch assignments', isLoading: false });
    }
  },

  fetchAssignment: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await assignmentApi.get(id);
      set({ currentAssignment: data.data, isLoading: false });
    } catch {
      set({ error: 'Assignment not found', isLoading: false });
    }
  },

  createAssignment: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await assignmentApi.create(payload);
      const assignment = data.data as Assignment;
      set((s) => ({ assignments: [assignment, ...s.assignments], currentAssignment: assignment, isLoading: false }));
      return assignment;
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, 'Failed to create assignment');
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  regenerate: async (id, notes) => {
    set({ error: null });
    try {
      const { data } = await assignmentApi.regenerate(id, notes);
      return data.data;
    } catch (err) {
      set({ error: getApiErrorMessage(err, 'Failed to regenerate assignment') });
      throw err;
    }
  },

  fetchDashboard: async () => {
    try {
      const { data } = await assignmentApi.dashboard();
      set({ dashboard: data.data });
    } catch { /* ignore */ }
  },

  setCurrentAssignment: (a) => set({ currentAssignment: a })
}));
