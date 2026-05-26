'use client';

import type { ComponentType, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, Bell, ChevronDown, Clock3, LayoutGrid, Library, LogOut, School2, Settings, SquarePen, CheckCircle2, Loader2, AlertCircle, BadgeInfo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useEffect, useRef, useState } from 'react';

const navItems = [
  { href: '/', label: 'Home', icon: LayoutGrid },
  { href: '/groups', label: 'My Groups', icon: School2 },
  { href: '/assignments', label: 'Assignments', icon: SquarePen },
  { href: '/toolkit', label: "AI Teacher's Toolkit", icon: Library },
  { href: '/library', label: 'My Library', icon: Clock3 }
];

const STATIC_NOTIFICATIONS = [
  { id: 'feature', icon: AlertCircle, color: 'text-blue-500', title: 'New feature: Rubric Generator', body: 'Try the AI Rubric Generator in your Toolkit.', time: '1 hr ago', href: '/toolkit' }
];

function NavItem({ href, label, icon: Icon, active }: { href: string; label: string; icon: ComponentType<{ className?: string }>; active?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-2xl px-4 py-3 text-[17px] text-neutral-500 transition hover:bg-black/[0.03] hover:text-[#1f1f1f]',
        active && 'bg-[#f2f2f2] text-[#1f1f1f]'
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
}

export function Shell({ children, title = 'Assignment', titleIcon: TitleIcon = LayoutGrid, activePath }: { children: ReactNode; title?: string; titleIcon?: ComponentType<{ className?: string }>; activePath?: string }) {
  const pathname = usePathname();
  const currentPath = activePath ?? pathname;
  const router = useRouter();
  const { user, accessToken, hasHydrated, logout, loadMe } = useAuthStore();
  const { items, markRead, markAllRead } = useNotificationStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (user) return;

    if (accessToken) {
      void loadMe();
      return;
    }

    router.replace('/auth/login');
  }, [accessToken, hasHydrated, loadMe, router, user]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleLogout() {
    await logout();
    router.replace('/auth/login');
  }

  function handleBellClick() {
    setNotifOpen(!notifOpen);
    markAllRead();
  }

  function handleNotificationClick(id: string) {
    markRead(id);
    setNotifOpen(false);
  }

  const initials = user?.name ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'U';
  const unreadCount = items.filter((item) => !item.read).length;
  const notifications = [...items, ...STATIC_NOTIFICATIONS];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f7f6_0%,#efefef_100%)] text-[#1f1f1f]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-5 p-3 md:p-4">
        {/* Sidebar */}
        <aside className="hidden w-[310px] shrink-0 rounded-[28px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] lg:flex lg:flex-col">
          <Link href="/" className="flex items-center gap-3 px-1 text-[30px] font-extrabold tracking-tight">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[linear-gradient(160deg,#ffb24f_0%,#ff6a2b_38%,#3a1c13_100%)] text-white shadow-[0_14px_30px_rgba(255,106,43,0.25)]">
              V
            </span>
            <span>VedaAI</span>
          </Link>

          <Link href="/create-assignment">
            <Button className="mt-10 h-16 w-full rounded-full border-4 border-[#ff824f] bg-[#2b2b2b] text-lg shadow-none hover:bg-[#1f1f1f]">
              <SquarePen className="h-5 w-5" />
              Create Assignment
            </Button>
          </Link>

          <nav className="mt-20 space-y-2">
            {navItems.map((item) => (
              <NavItem key={item.href} {...item} active={currentPath === item.href} />
            ))}
          </nav>

          <div className="mt-auto space-y-4 pt-8">
            <Link href="/settings" className="flex items-center gap-3 px-2 text-[17px] text-neutral-500 hover:text-[#1f1f1f]">
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
            <div className="rounded-[24px] bg-[#f4f3f2] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
              <div className="flex items-center gap-3">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#fde5d8] text-[22px] font-bold text-[#ff6a2b]">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold">{user?.name ?? 'Teacher'}</div>
                  <div className="truncate text-sm text-neutral-500">{user?.school || user?.email || ''}</div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden">
          <header className="flex items-center justify-between rounded-[24px] bg-white px-5 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.06)] md:px-6">
            <div className="flex items-center gap-3 text-neutral-500">
              <button onClick={() => router.back()} className="grid h-12 w-12 place-items-center rounded-full bg-black/[0.03] text-[#1f1f1f] transition hover:bg-black/[0.06]" aria-label="Back">
                <ArrowLeft className="h-5 w-5 text-[#1f1f1f]" />
              </button>
              <TitleIcon className="h-5 w-5 text-neutral-500" />
              <span className="text-[18px] font-semibold text-neutral-500">{title}</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Bell / Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={handleBellClick}
                  className="relative grid h-11 w-11 place-items-center rounded-full bg-black/[0.03] text-[#1f1f1f] transition hover:bg-black/[0.06]"
                  aria-label="Notifications"
                >
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-[#ff6a2b]" />
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-[340px] rounded-[20px] bg-white p-3 shadow-[0_8px_32px_rgba(0,0,0,0.14)] ring-1 ring-black/5">
                    <div className="mb-3 flex items-center justify-between px-2">
                      <span className="text-[15px] font-semibold text-[#1f1f1f]">Notifications</span>
                      <span className="text-[12px] text-neutral-400">{notifications.length} recent</span>
                    </div>
                    <div className="space-y-1">
                      {notifications.map((n) => {
                        const Icon = 'icon' in n
                          ? n.icon
                          : n.kind === 'completed'
                            ? CheckCircle2
                            : n.kind === 'failed'
                              ? AlertCircle
                              : n.kind === 'queued'
                                ? Clock3
                                : BadgeInfo;
                        const color = 'color' in n ? n.color : n.kind === 'completed' ? 'text-green-500' : n.kind === 'queued' ? 'text-amber-500' : n.kind === 'failed' ? 'text-red-500' : 'text-blue-500';
                        return (
                          <Link
                            key={n.id}
                            href={n.href ?? '/'}
                            onClick={() => handleNotificationClick(n.id)}
                            className={cn(
                              'flex items-start gap-3 rounded-[14px] px-3 py-3 transition hover:bg-neutral-50',
                              'cursor-pointer'
                            )}
                          >
                            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-semibold text-[#1f1f1f] leading-5">{n.title}</p>
                              <p className="text-[12px] text-neutral-500 leading-5">{n.body}</p>
                            </div>
                            <span className="shrink-0 text-[11px] text-neutral-400">{'time' in n ? n.time : new Date(n.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                          </Link>
                        );
                      })}
                    </div>
                    <div className="mt-3 border-t border-neutral-100 pt-3">
                      <Link
                        href="/notifications"
                        className="flex w-full items-center justify-center rounded-[12px] py-2 text-[13px] font-medium text-[#ff6a2b] hover:bg-orange-50"
                        onClick={() => setNotifOpen(false)}
                      >
                        View all notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User dropdown */}
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 rounded-full bg-black/[0.03] px-3 py-2 text-[#1f1f1f]"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-[#fde5d8] text-[15px] font-bold text-[#ff6a2b]">
                    {initials}
                  </div>
                  <span className="hidden font-semibold sm:block">{user?.name?.split(' ')[0] ?? 'Teacher'}</span>
                  <ChevronDown className="h-5 w-5 text-neutral-500" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-[18px] bg-white p-2 shadow-[0_8px_32px_rgba(0,0,0,0.12)] ring-1 ring-black/5 z-50">
                    <div className="px-3 py-2 text-[13px] text-neutral-400">{user?.email}</div>
                    <hr className="my-1 border-neutral-100" />
                    <Link href="/settings" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[15px] text-[#1f1f1f] hover:bg-black/[0.04]" onClick={() => setDropdownOpen(false)}>
                      <Settings className="h-4 w-4" /> Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-[15px] text-red-500 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-auto pr-1">{children}</div>
        </main>
      </div>
    </div>
  );
}
