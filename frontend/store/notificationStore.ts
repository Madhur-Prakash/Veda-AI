'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationKind = 'queued' | 'completed' | 'failed' | 'info';

export interface AppNotification {
  id: string;
  dedupeKey: string;
  title: string;
  body: string;
  href?: string;
  kind: NotificationKind;
  createdAt: string;
  read: boolean;
}

interface NotificationState {
  items: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
}

function createId() {
  return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      items: [],

      addNotification: (notification) => {
        set((state) => ({
          items: (() => {
            const nextItem = {
              ...notification,
              id: createId(),
              createdAt: new Date().toISOString(),
              read: false
            };

            const existingIndex = state.items.findIndex((item) => item.dedupeKey === notification.dedupeKey);
            if (existingIndex === -1) {
              return [nextItem, ...state.items].slice(0, 20);
            }

            const nextItems = [...state.items];
            nextItems[existingIndex] = {
              ...nextItems[existingIndex],
              ...nextItem,
              id: nextItems[existingIndex].id,
              createdAt: nextItems[existingIndex].createdAt,
              read: false
            };
            return nextItems;
          })()
        }));
      },

      markRead: (id) => set((state) => ({ items: state.items.map((item) => (item.id === id ? { ...item, read: true } : item)) })),
      markAllRead: () => set((state) => ({ items: state.items.map((item) => ({ ...item, read: true })) })),
      clear: () => set({ items: [] })
    }),
    {
      name: 'vedaai-notifications'
    }
  )
);