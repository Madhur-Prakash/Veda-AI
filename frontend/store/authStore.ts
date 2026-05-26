'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { authApi } from '@/lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  hasHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, school?: string) => Promise<void>;
  logout: () => Promise<void>;
  loadMe: () => Promise<void>;
  setToken: (token: string) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,
      hasHydrated: false,

      setToken: (token) => {
        set({ accessToken: token });
        if (typeof window !== 'undefined') localStorage.setItem('accessToken', token);
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authApi.login({ email, password });
          const { user, accessToken } = data.data;
          if (typeof window !== 'undefined') localStorage.setItem('accessToken', accessToken);
          set({ user, accessToken, isLoading: false });
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
          const { user, accessToken } = data.data;
          if (typeof window !== 'undefined') localStorage.setItem('accessToken', accessToken);
          set({ user, accessToken, isLoading: false });
        } catch (err: unknown) {
          const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Registration failed';
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        try { await authApi.logout(); } catch { /* ignore */ }
        if (typeof window !== 'undefined') localStorage.removeItem('accessToken');
        set({ user: null, accessToken: null });
      },

      loadMe: async () => {
        set({ isLoading: true });
        try {
          const { data } = await authApi.me();
          set({ user: data.data, isLoading: false });
        } catch {
          set({ user: null, accessToken: null, isLoading: false });
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'vedaai-auth',
      partialize: (state) => ({ accessToken: state.accessToken, user: state.user }),
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ hasHydrated: true });
      }
    }
  )
);
