'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { authApi } from '@/lib/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  hasHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, school?: string) => Promise<void>;
  logout: () => Promise<void>;
  loadMe: () => Promise<void>;
  updateProfile: (data: { name?: string; school?: string }) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,
      hasHydrated: false,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authApi.login({ email, password });
          set({ user: data.data.user, isLoading: false });
        } catch (err: unknown) {
          const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Login failed';
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      register: async (name, email, password, school) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authApi.register({ name, email, password, school });
          set({ user: data.data.user, isLoading: false });
        } catch (err: unknown) {
          const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Registration failed';
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        try { await authApi.logout(); } catch { /* ignore */ }
        set({ user: null });
      },

      loadMe: async () => {
        set({ isLoading: true });
        try {
          const { data } = await authApi.me();
          set({ user: data.data, isLoading: false });
        } catch {
          set({ user: null, isLoading: false });
        }
      },

      updateProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const { data: res } = await authApi.updateProfile(data);
          set({ user: res.data, isLoading: false });
        } catch (err: unknown) {
          const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Update failed';
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'vedaai-auth',
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ hasHydrated: true });
      }
    }
  )
);
