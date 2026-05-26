'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, FileText, MessageSquareQuote, ScanSearch, SquarePen } from 'lucide-react';
import { Skeleton } from 'boneyard-js/react';
import { Shell } from '@/components/shell';
import { useAssignmentStore } from '@/store/assignmentStore';

export default function HomePage() {
  const { assignments, fetchAssignments, dashboard, fetchDashboard, isLoading } = useAssignmentStore();

  useEffect(() => {
    fetchAssignments();
    fetchDashboard();
  }, [fetchAssignments, fetchDashboard]);

  const hasAssignments = assignments.length > 0;
  const recentAssignments = assignments.slice(0, 6);

  if (isLoading && !hasAssignments) {
    return (
      <Shell activePath="/">
        <div className="px-1 pb-10 space-y-6">
          <Skeleton
            name="home-loading"
            loading
            fixture={<HomeLoadingFixture />}
            fallback={<HomeLoadingFallback />}
          >
            <HomeLoadingFixture />
          </Skeleton>
        </div>
      </Shell>
    );
  }

  return (
    <Shell activePath="/">
      {hasAssignments ? (
        <div className="px-1 pb-10 space-y-6">
          <Skeleton
            name="home-dashboard-stats"
            loading={isLoading || !dashboard}
            fixture={<HomeStatsFixture />}
            fallback={<HomeStatsFallback />}
          >
            {dashboard && (
              <div className="grid gap-4 md:grid-cols-4">
                {[
                  { label: 'Total Assignments', value: dashboard.totalAssignments, color: 'text-[#1f1f1f]' },
                  { label: 'Completed', value: dashboard.completedAssignments, color: 'text-green-600' },
                  { label: 'In Progress', value: dashboard.processingJobs, color: 'text-blue-600' },
                  { label: 'Success Rate', value: `${dashboard.successRate}%`, color: 'text-[#ff6a2b]' }
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-[24px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                    <p className="text-[13px] text-neutral-400">{label}</p>
                    <p className={`mt-1 font-display text-[32px] font-semibold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            )}
          </Skeleton>

          {/* Recent assignments */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[20px] font-semibold">Recent Assignments</h2>
              <Link href="/assignments" className="text-[14px] font-medium text-[#ff6a2b] hover:underline">View all →</Link>
            </div>
            <Skeleton
              name="home-recent-assignments"
              loading={isLoading}
              fixture={<RecentAssignmentsFixture />}
              fallback={<RecentAssignmentsFallback />}
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {recentAssignments.map((a) => (
                  <Link
                    key={a.externalId}
                    href={a.status === 'COMPLETED' ? `/assessment/${a.externalId}` : `/generation-status?id=${a.externalId}`}
                    className="group rounded-[24px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-[16px] leading-6 group-hover:text-[#ff6a2b] transition truncate">{a.title}</h3>
                      {a.status === 'COMPLETED' && <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />}
                    </div>
                    <p className="mt-1 text-[13px] text-neutral-500">{a.subject} · {a.className}</p>
                    <p className="mt-3 text-[12px] text-neutral-400">Due {new Date(a.dueDate).toLocaleDateString()}</p>
                  </Link>
                ))}
              </div>
            </Skeleton>
          </div>

          <div className="flex justify-center">
            <Link href="/create-assignment" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#1f1f1f] px-7 text-[15px] font-medium text-white shadow-[0_10px_20px_rgba(0,0,0,0.14)] hover:bg-black">
              <SquarePen className="h-4 w-4" />
              Create New Assignment
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        /* Empty state */
        <section className="flex min-h-[calc(100vh-140px)] flex-col items-center justify-center px-4 py-10 text-center md:py-16">
          <div className="relative flex items-center justify-center">
            <div className="absolute h-[320px] w-[320px] rounded-full bg-white/55 blur-2xl" />
            <div className="relative flex h-[180px] w-[180px] items-center justify-center rounded-full bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
              <SquarePen className="h-16 w-16 text-[#ff6a2b]" />
            </div>
          </div>

          <div className="mt-8 max-w-2xl space-y-4">
            <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">No assignments yet</h1>
            <p className="mx-auto max-w-xl text-[18px] leading-8 text-neutral-500">
              Create your first AI-generated assessment. Set up question types, difficulty, and let the AI do the rest.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/create-assignment" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#1f1f1f] px-7 text-[15px] font-medium text-white shadow-[0_10px_20px_rgba(0,0,0,0.14)] hover:bg-black">
              <SquarePen className="h-4 w-4" />
              Create Your First Assignment
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-12 grid w-full max-w-4xl gap-4 md:grid-cols-3">
            {[
              { icon: MessageSquareQuote, label: 'AI-assisted generation', desc: 'Generate complete question papers using Groq LLM in seconds' },
              { icon: FileText, label: 'PDF export ready', desc: 'Download professionally formatted PDFs with one click' },
              { icon: ScanSearch, label: 'Real-time progress', desc: 'Watch your assessment being built live with WebSocket updates' }
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="rounded-[26px] border border-white/80 bg-white/80 p-5 text-left shadow-[0_2px_8px_rgba(0,0,0,0.06)] backdrop-blur-sm">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#ff6a2b]">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-[#ff6a2b]/10"><Icon className="h-3.5 w-3.5" /></span>
                  {label}
                </div>
                <p className="text-[14px] leading-6 text-neutral-600">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </Shell>
  );
}

function HomeStatsFallback() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-[24px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="h-3 w-24 animate-pulse rounded-full bg-neutral-100" />
          <div className="mt-3 h-8 w-20 animate-pulse rounded-full bg-neutral-100" />
        </div>
      ))}
    </div>
  );
}

function HomeStatsFixture() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {[
        { label: 'Total Assignments', value: '18' },
        { label: 'Completed', value: '12' },
        { label: 'In Progress', value: '4' },
        { label: 'Success Rate', value: '94%' }
      ].map((item) => (
        <div key={item.label} className="rounded-[24px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <p className="text-[13px] text-neutral-400">{item.label}</p>
          <p className="mt-1 font-display text-[32px] font-semibold text-[#1f1f1f]">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function RecentAssignmentsFallback() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-[24px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="h-5 w-3/4 animate-pulse rounded-full bg-neutral-100" />
          <div className="mt-3 h-4 w-1/2 animate-pulse rounded-full bg-neutral-100" />
          <div className="mt-6 h-3 w-1/3 animate-pulse rounded-full bg-neutral-100" />
        </div>
      ))}
    </div>
  );
}

function RecentAssignmentsFixture() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[
        { title: 'Unit Test on Fractions', subject: 'Mathematics', className: '8', date: 'May 26, 2026' },
        { title: 'Chapter Review: Ecosystems', subject: 'Science', className: '7', date: 'May 25, 2026' },
        { title: 'History Essay Draft', subject: 'History', className: '9', date: 'May 24, 2026' }
      ].map((item) => (
        <div key={item.title} className="group rounded-[24px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <h3 className="font-semibold text-[16px] leading-6 truncate text-[#1f1f1f]">{item.title}</h3>
          <p className="mt-1 text-[13px] text-neutral-500">{item.subject} · Class {item.className}</p>
          <p className="mt-3 text-[12px] text-neutral-400">Due {item.date}</p>
        </div>
      ))}
    </div>
  );
}

function HomeLoadingFallback() {
  return (
    <div className="space-y-6">
      <HomeStatsFallback />
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="h-6 w-40 animate-pulse rounded-full bg-neutral-100" />
          <div className="h-4 w-24 animate-pulse rounded-full bg-neutral-100" />
        </div>
        <RecentAssignmentsFallback />
      </div>
    </div>
  );
}

function HomeLoadingFixture() {
  return (
    <div className="space-y-6">
      <HomeStatsFixture />
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[20px] font-semibold">Recent Assignments</h2>
          <span className="text-[14px] font-medium text-[#ff6a2b]">View all →</span>
        </div>
        <RecentAssignmentsFixture />
      </div>
    </div>
  );
}
