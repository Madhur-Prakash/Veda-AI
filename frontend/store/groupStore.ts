'use client';

import { create } from 'zustand';
import type { Group } from '@/types';
import { groupApi } from '@/lib/api';

function extractMessage(err: unknown, fallback: string): string {
  return (
    (err as { response?: { data?: { error?: { message?: string } } } })
      ?.response?.data?.error?.message ?? fallback
  );
}

interface GroupState {
  groups: Group[];
  isLoading: boolean;
  error: string | null;
  fetchGroups: () => Promise<void>;
  createGroup: (data: { name: string; subject: string; className: string; colorIdx?: number }) => Promise<Group>;
  deleteGroup: (id: string) => Promise<void>;
  assignPaper: (groupId: string, paper: { assignmentExternalId: string; assignmentTitle: string; dueDate?: string }) => Promise<Group>;
  removePaper: (groupId: string, assignmentExternalId: string) => Promise<Group>;
  refreshInvite: (groupId: string) => Promise<string>;
  clearError: () => void;
}

export const useGroupStore = create<GroupState>()((set, get) => ({
  groups: [],
  isLoading: false,
  error: null,

  fetchGroups: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await groupApi.list();
      set({ groups: data.data as Group[], isLoading: false });
    } catch (err) {
      set({ error: extractMessage(err, 'Failed to load groups'), isLoading: false });
    }
  },

  createGroup: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await groupApi.create(payload);
      const group = data.data as Group;
      set({ groups: [group, ...get().groups], isLoading: false });
      return group;
    } catch (err) {
      set({ error: extractMessage(err, 'Failed to create group'), isLoading: false });
      throw err;
    }
  },

  deleteGroup: async (id) => {
    try {
      await groupApi.remove(id);
      set({ groups: get().groups.filter((g) => g.externalId !== id) });
    } catch (err) {
      set({ error: extractMessage(err, 'Failed to delete group') });
      throw err;
    }
  },

  assignPaper: async (groupId, paper) => {
    try {
      const { data } = await groupApi.assignPaper(groupId, paper);
      const updated = data.data as Group;
      set({ groups: get().groups.map((g) => g.externalId === groupId ? updated : g) });
      return updated;
    } catch (err) {
      set({ error: extractMessage(err, 'Failed to assign paper') });
      throw err;
    }
  },

  removePaper: async (groupId, assignmentExternalId) => {
    try {
      const { data } = await groupApi.removePaper(groupId, assignmentExternalId);
      const updated = data.data as Group;
      set({ groups: get().groups.map((g) => g.externalId === groupId ? updated : g) });
      return updated;
    } catch (err) {
      set({ error: extractMessage(err, 'Failed to remove paper') });
      throw err;
    }
  },

  refreshInvite: async (groupId) => {
    try {
      const { data } = await groupApi.refreshInvite(groupId);
      const code = data.data.inviteCode as string;
      set({
        groups: get().groups.map((g) =>
          g.externalId === groupId ? { ...g, inviteCode: code } : g
        )
      });
      return code;
    } catch (err) {
      set({ error: extractMessage(err, 'Failed to refresh invite code') });
      throw err;
    }
  },

  clearError: () => set({ error: null })
}));
