'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, MoreVertical, Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import { Skeleton } from 'boneyard-js/react';
import { Shell } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { useAssignmentStore } from '@/store/assignmentStore';
import type { Assignment } from '@/types';

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  QUEUED: { label: 'Queued', bg: 'bg-neutral-100', text: 'text-neutral-600' },
  PROCESSING: { label: 'Generating', bg: 'bg-blue-100', text: 'text-blue-700' },
  COMPLETED: { label: 'Ready', bg: 'bg-green-100', text: 'text-green-700' },
  FAILED: { label: 'Failed', bg: 'bg-red-100', text: 'text-red-600' },
  REGENERATING: { label: 'Regenerating', bg: 'bg-yellow-100', text: 'text-yellow-700' }
};

function AssignmentCard({ assignment, onMenuToggle, menuOpen }: { assignment: Assignment; onMenuToggle: () => void; menuOpen: boolean }) {
  const router = useRouter();
  const badge = STATUS_BADGE[assignment.status] ?? STATUS_BADGE.QUEUED;

  function navigate() {
    if (assignment.status === 'COMPLETED') router.push(`/assessment/${assignment.externalId}`);
    else if (assignment.status === 'PROCESSING' || assignment.status === 'QUEUED') router.push(`/generation-status?id=${assignment.externalId}`);
  }

  return (
    <article className="relative min-h-[196px] rounded-[28px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <button onClick={navigate} className="text-left">
            <h2 className="font-display text-[22px] font-semibold tracking-tight underline decoration-2 underline-offset-4 truncate hover:text-[#ff6a2b]">
              {assignment.title}
            </h2>
          </button>
          <p className="mt-1 truncate text-[14px] text-neutral-500">{assignment.subject} · {assignment.className}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>
          <button className="rounded-full p-1 text-neutral-400 hover:bg-black/[0.04] hover:text-[#1f1f1f]" onClick={onMenuToggle}>
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-10 flex items-end justify-between gap-4 text-[14px]">
        <p><span className="font-semibold">Topic:</span> <span className="text-neutral-400">{assignment.topic}</span></p>
        <p><span className="font-semibold">Due:</span> <span className="text-neutral-400">{new Date(assignment.dueDate).toLocaleDateString()}</span></p>
      </div>

      {menuOpen && (
        <div className="absolute right-14 top-[72px] z-10 w-48 rounded-[18px] bg-white p-2 shadow-[0_8px_32px_rgba(0,0,0,0.12)] ring-1 ring-black/5">
          <Link href={`/assessment/${assignment.externalId}`} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[15px] text-[#1f1f1f] hover:bg-black/[0.04]">
            <FileText className="h-4 w-4" /> View Assessment
          </Link>
          <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[15px] text-red-500 hover:bg-red-50">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      )}
    </article>
  );
}

export default function AssignmentsPage() {
  const { assignments, fetchAssignments, isLoading } = useAssignmentStore();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  const filtered = assignments.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Shell activePath="/assignments">
      <div className="space-y-5 px-1 pb-24 md:px-0" onClick={() => setOpenMenuId(null)}>
        <div className="flex items-start gap-4 px-2 pt-1">
          <div className="mt-1 h-5 w-5 shrink-0 rounded-full bg-[#4bc37e] shadow-[0_0_0_8px_rgba(75,195,126,0.14)]" />
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Assignments</h1>
            <p className="mt-1 text-[18px] text-neutral-400">Manage and create assignments for your classes.</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-[28px] bg-white px-5 py-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] md:flex-row md:items-center md:justify-between">
          <button className="inline-flex items-center gap-3 text-[16px] font-medium text-neutral-400">
            <SlidersHorizontal className="h-5 w-5" /> Filter By
          </button>
          <div className="relative w-full md:max-w-[440px]">
            <Search className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by title or subject"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-14 w-full rounded-full border border-[#d5d1cf] bg-white pl-14 pr-5 text-[15px] outline-none focus:border-[#ff6a2b] focus:ring-2 focus:ring-[#ff6a2b]/20"
            />
          </div>
        </div>

        {isLoading ? (
          <Skeleton
            name="assignments-grid"
            loading
            fixture={<AssignmentsGridFixture />}
            fallback={<AssignmentsGridFallback />}
          >
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((a) => (
                <AssignmentCard
                  key={a.externalId}
                  assignment={a}
                  menuOpen={openMenuId === a.externalId}
                  onMenuToggle={(e) => {
                    (e as unknown as React.MouseEvent).stopPropagation();
                    setOpenMenuId(openMenuId === a.externalId ? null : a.externalId);
                  }}
                />
              ))}
            </div>
          </Skeleton>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-[28px] bg-white text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <p className="text-[18px] font-semibold text-neutral-400">{search ? 'No results found' : 'No assignments yet'}</p>
            <Link href="/create-assignment" className="flex items-center gap-2 rounded-full bg-[#1f1f1f] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-black">
              <Plus className="h-4 w-4" /> Create your first
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((a) => (
              <AssignmentCard
                key={a.externalId}
                assignment={a}
                menuOpen={openMenuId === a.externalId}
                onMenuToggle={(e) => {
                  (e as unknown as React.MouseEvent).stopPropagation();
                  setOpenMenuId(openMenuId === a.externalId ? null : a.externalId);
                }}
              />
            ))}
          </div>
        )}

        <div className="fixed bottom-5 left-1/2 z-20 -translate-x-1/2">
          <Link href="/create-assignment">
            <Button className="h-14 rounded-full px-7 text-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.18)]">
              <Plus className="h-5 w-5" /> Create Assignment
            </Button>
          </Link>
        </div>
      </div>
    </Shell>
  );
}

function AssignmentsGridFallback() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-[196px] rounded-[28px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="h-6 w-3/4 animate-pulse rounded-full bg-neutral-100" />
          <div className="mt-3 h-4 w-1/2 animate-pulse rounded-full bg-neutral-100" />
          <div className="mt-10 h-4 w-2/3 animate-pulse rounded-full bg-neutral-100" />
        </div>
      ))}
    </div>
  );
}

function AssignmentsGridFixture() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[
        { title: 'Quiz on Electricity', subject: 'Science', className: '8', topic: 'Electric circuits', due: 'May 28, 2026' },
        { title: 'Algebra Practice Set', subject: 'Mathematics', className: '9', topic: 'Linear equations', due: 'May 29, 2026' },
        { title: 'History Source Analysis', subject: 'History', className: '10', topic: 'Indian independence', due: 'May 30, 2026' },
        { title: 'Biology Unit Review', subject: 'Biology', className: '7', topic: 'Cell structure', due: 'May 31, 2026' }
      ].map((item) => (
        <article key={item.title} className="relative min-h-[196px] rounded-[28px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-[22px] font-semibold tracking-tight truncate">{item.title}</h2>
              <p className="mt-1 truncate text-[14px] text-neutral-500">{item.subject} · {item.className}</p>
            </div>
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-600">Queued</span>
          </div>
          <div className="mt-10 flex items-end justify-between gap-4 text-[14px]">
            <p><span className="font-semibold">Topic:</span> <span className="text-neutral-400">{item.topic}</span></p>
            <p><span className="font-semibold">Due:</span> <span className="text-neutral-400">{item.due}</span></p>
          </div>
        </article>
      ))}
    </div>
  );
}
