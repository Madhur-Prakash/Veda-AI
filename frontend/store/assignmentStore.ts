'use client';

import { create } from 'zustand';
import type { Assignment, AssignmentCreatePayload, DashboardSummary } from '@/types';
import { assignmentApi } from '@/lib/api';

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
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Failed to create assignment';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  regenerate: async (id, notes) => {
    const { data } = await assignmentApi.regenerate(id, notes);
    return data.data;
  },

  fetchDashboard: async () => {
    try {
      const { data } = await assignmentApi.dashboard();
      set({ dashboard: data.data });
    } catch { /* ignore */ }
  },

  setCurrentAssignment: (a) => set({ currentAssignment: a })
}));
