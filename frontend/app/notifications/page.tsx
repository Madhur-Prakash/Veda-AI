'use client';

import Link from 'next/link';
import { Bell, BellRing, CheckCircle2, Clock3, Loader2 } from 'lucide-react';
import { Shell } from '@/components/shell';
import { useNotificationStore } from '@/store/notificationStore';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const { items, markRead, markAllRead } = useNotificationStore();

  return (
    <Shell title="Notifications" titleIcon={Bell}>
      <div className="mx-auto w-full max-w-[920px] px-1 pb-10 md:px-0">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-[28px] font-semibold tracking-tight md:text-[36px]">All Notifications</h1>
            <p className="mt-1 text-[15px] text-neutral-500">Review queued jobs, completions, and updates from the generation pipeline.</p>
          </div>

          <button
            onClick={markAllRead}
            className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-[14px] font-semibold text-[#1f1f1f] shadow-sm hover:bg-neutral-50"
          >
            Mark all read
          </button>
        </div>

        <section className="rounded-[32px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] md:p-6">
          {items.length === 0 ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-[#fff4ee] text-[#ff6a2b]">
                <BellRing className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-[22px] font-semibold text-[#1f1f1f]">No notifications yet</h2>
              <p className="mt-2 max-w-md text-[15px] text-neutral-500">When you create or regenerate an assessment, the queue and completion alerts will appear here.</p>
              <Link href="/create-assignment" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1f1f1f] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-black">
                Create Assignment
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((notification) => {
                const Icon = notification.kind === 'completed' ? CheckCircle2 : notification.kind === 'queued' ? Loader2 : Clock3;
                const iconClass = notification.kind === 'completed' ? 'text-green-500' : notification.kind === 'queued' ? 'text-amber-500' : 'text-blue-500';

                return (
                  <Link
                    key={notification.id}
                    href={notification.href ?? '/'}
                    onClick={() => markRead(notification.id)}
                    className={cn(
                      'flex items-start gap-4 rounded-[22px] border border-neutral-100 p-4 transition hover:border-neutral-200 hover:bg-neutral-50',
                      !notification.read && 'bg-[#fffaf7]'
                    )}
                  >
                    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white shadow-sm ${iconClass}`}>
                      {Icon === Loader2 ? <Loader2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <p className="truncate text-[15px] font-semibold text-[#1f1f1f]">{notification.title}</p>
                        <span className="shrink-0 text-[12px] text-neutral-400">{new Date(notification.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="mt-1 text-[14px] leading-6 text-neutral-500">{notification.body}</p>
                      <p className="mt-2 text-[12px] font-medium text-[#ff6a2b]">Open linked assessment</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </Shell>
  );
}