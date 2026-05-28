'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  School2, Plus, Users, BookOpen, Calendar, MoreHorizontal,
  X, Check, Loader2, Trash2, Link2, ArrowLeft, FileText, ChevronRight
} from 'lucide-react';
import { Shell } from '@/components/shell';
import { useGroupStore } from '@/store/groupStore';
import { useAssignmentStore } from '@/store/assignmentStore';
import type { Group, Assignment } from '@/types';

const COLORS = [
  { bg: 'bg-blue-500',   ring: 'ring-blue-400' },
  { bg: 'bg-emerald-500', ring: 'ring-emerald-400' },
  { bg: 'bg-violet-500', ring: 'ring-violet-400' },
  { bg: 'bg-amber-500',  ring: 'ring-amber-400' },
  { bg: 'bg-rose-500',   ring: 'ring-rose-400' },
  { bg: 'bg-cyan-500',   ring: 'ring-cyan-400' },
  { bg: 'bg-indigo-500', ring: 'ring-indigo-400' },
  { bg: 'bg-pink-500',   ring: 'ring-pink-400' }
];

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ─── Create Group Modal ───────────────────────────────────────────────────────
function CreateGroupModal({
  onClose,
  onCreated
}: {
  onClose: () => void;
  onCreated: (g: Group) => void;
}) {
  const { createGroup, isLoading, error, clearError } = useGroupStore();
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [className, setClassName] = useState('');
  const [colorIdx, setColorIdx] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    try {
      const group = await createGroup({ name: name.trim(), subject: subject.trim(), className: className.trim(), colorIdx });
      onCreated(group);
    } catch { /* error shown from store */ }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-[480px] rounded-[32px] bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-[20px] font-bold text-[#1f1f1f]">Create New Group</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-neutral-100">
            <X className="h-4 w-4 text-neutral-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-neutral-700">Group Name</label>
            <input
              required minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Class 9A – Mathematics"
              className="h-11 w-full rounded-full border border-neutral-200 bg-[#f8f8f8] px-4 text-[14px] outline-none focus:border-[#ff6a2b] focus:ring-2 focus:ring-[#ff6a2b]/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-neutral-700">Subject</label>
              <input
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Science"
                className="h-11 w-full rounded-full border border-neutral-200 bg-[#f8f8f8] px-4 text-[14px] outline-none focus:border-[#ff6a2b] focus:ring-2 focus:ring-[#ff6a2b]/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-neutral-700">Class / Grade</label>
              <input
                required
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g. 9"
                className="h-11 w-full rounded-full border border-neutral-200 bg-[#f8f8f8] px-4 text-[14px] outline-none focus:border-[#ff6a2b] focus:ring-2 focus:ring-[#ff6a2b]/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-semibold text-neutral-700">Group Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setColorIdx(i)}
                  className={`h-8 w-8 rounded-full ${c.bg} transition ${colorIdx === i ? `ring-2 ring-offset-2 ${c.ring}` : ''}`}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] text-red-600">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#1f1f1f] py-3 text-[14px] font-semibold text-white hover:bg-black disabled:opacity-60"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create Group
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-neutral-200 px-6 py-3 text-[14px] font-medium text-neutral-600 hover:bg-neutral-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Assign Paper Modal ───────────────────────────────────────────────────────
function AssignPaperModal({
  group,
  onClose
}: {
  group: Group;
  onClose: () => void;
}) {
  const { assignPaper, isLoading, error, clearError } = useGroupStore();
  const { assignments, fetchAssignments } = useAssignmentStore();
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (assignments.length === 0) fetchAssignments();
    clearError();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const completed = assignments.filter((a) => a.status === 'COMPLETED');
  const alreadyAssigned = new Set(group.assignedPapers.map((p) => p.assignmentExternalId));
  const available = completed.filter((a) => !alreadyAssigned.has(a.externalId));

  async function handleAssign() {
    if (!selected) return;
    clearError();
    try {
      await assignPaper(group.externalId, {
        assignmentExternalId: selected.externalId,
        assignmentTitle: selected.title,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined
      });
      setDone(true);
      setTimeout(onClose, 800);
    } catch { /* error from store */ }
  }

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-[540px] rounded-[32px] bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-bold text-[#1f1f1f]">Assign Paper</h2>
            <p className="text-[13px] text-neutral-500">to {group.name}</p>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-neutral-100">
            <X className="h-4 w-4 text-neutral-400" />
          </button>
        </div>

        {available.length === 0 ? (
          <div className="py-10 text-center text-neutral-400">
            <FileText className="mx-auto mb-3 h-8 w-8 text-neutral-300" />
            <p className="text-[14px] font-medium">No completed assessments available.</p>
            <p className="mt-1 text-[13px]">All papers are either still generating or already assigned.</p>
          </div>
        ) : (
          <>
            <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1">
              {available.map((a) => (
                <button
                  key={a.externalId}
                  onClick={() => setSelected(a)}
                  className={`w-full rounded-[18px] border p-4 text-left transition ${
                    selected?.externalId === a.externalId
                      ? 'border-[#ff6a2b] bg-[#fff8f5]'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <p className="text-[14px] font-semibold text-[#1f1f1f]">{a.title}</p>
                  <p className="mt-0.5 text-[12px] text-neutral-500">{a.subject} · Class {a.className} · {a.totalMarks} marks</p>
                </button>
              ))}
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-[13px] font-semibold text-neutral-700">Due Date (optional)</label>
              <input
                type="date"
                value={dueDate}
                min={minDate.toISOString().split('T')[0]}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-11 w-full rounded-full border border-neutral-200 bg-[#f8f8f8] px-4 text-[14px] outline-none focus:border-[#ff6a2b]"
              />
            </div>
          </>
        )}

        {error && (
          <p className="mt-3 rounded-[14px] border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] text-red-600">{error}</p>
        )}

        {available.length > 0 && (
          <div className="mt-5 flex gap-3">
            <button
              onClick={handleAssign}
              disabled={!selected || isLoading || done}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#1f1f1f] py-3 text-[14px] font-semibold text-white hover:bg-black disabled:opacity-60"
            >
              {done ? (
                <><Check className="h-4 w-4 text-green-400" /> Assigned!</>
              ) : isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Assign Paper'
              )}
            </button>
            <button
              onClick={onClose}
              className="rounded-full border border-neutral-200 px-6 py-3 text-[14px] font-medium text-neutral-600 hover:bg-neutral-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Group Detail Panel ───────────────────────────────────────────────────────
function GroupDetail({
  group,
  onBack,
  onAssign
}: {
  group: Group;
  onBack: () => void;
  onAssign: () => void;
}) {
  const router = useRouter();
  const { removePaper, refreshInvite } = useGroupStore();
  const [inviteCode, setInviteCode] = useState(group.inviteCode);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const color = COLORS[group.colorIdx ?? 0];

  async function handleRefreshInvite() {
    setRefreshing(true);
    try {
      const code = await refreshInvite(group.externalId);
      setInviteCode(code);
    } finally {
      setRefreshing(false);
    }
  }

  function copyInvite() {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div>
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-2 text-[13px] font-medium text-neutral-400 hover:text-[#1f1f1f]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Groups
        </button>
        <div className="flex items-center gap-4">
          <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-[20px] ${color.bg} text-[20px] font-bold text-white`}>
            {initials(group.name)}
          </div>
          <div>
            <h2 className="text-[22px] font-bold text-[#1f1f1f]">{group.name}</h2>
            <p className="text-[14px] text-neutral-500">{group.subject} · Class {group.className}</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Users, label: 'Students', value: group.studentCount },
          { icon: BookOpen, label: 'Papers', value: group.assignedPapers.length },
          { icon: Calendar, label: 'Created', value: formatDate(group.createdAt) }
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-[18px] bg-white px-4 py-3 text-center shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-center gap-1.5 text-[12px] text-neutral-400 mb-1">
              <Icon className="h-3.5 w-3.5" /> {label}
            </div>
            <div className="text-[18px] font-bold text-[#1f1f1f]">{value}</div>
          </div>
        ))}
      </div>

      {/* Assigned papers */}
      <div className="rounded-[24px] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[16px] font-semibold text-[#1f1f1f]">Assigned Papers</h3>
          <button
            onClick={onAssign}
            className="flex items-center gap-1.5 rounded-full bg-[#1f1f1f] px-4 py-2 text-[13px] font-semibold text-white hover:bg-black"
          >
            <Plus className="h-3.5 w-3.5" /> Assign Paper
          </button>
        </div>

        {group.assignedPapers.length === 0 ? (
          <div className="py-8 text-center text-neutral-400">
            <FileText className="mx-auto mb-2 h-7 w-7 text-neutral-300" />
            <p className="text-[14px]">No papers assigned yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {group.assignedPapers.map((p) => (
              <div
                key={p.assignmentExternalId}
                className="flex items-center gap-3 rounded-[16px] border border-neutral-100 px-4 py-3"
              >
                <FileText className="h-4 w-4 shrink-0 text-neutral-400" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[14px] font-semibold text-[#1f1f1f]">{p.assignmentTitle}</p>
                  <p className="text-[12px] text-neutral-400">
                    Assigned {formatDate(p.assignedAt)}
                    {p.dueDate && ` · Due ${formatDate(p.dueDate)}`}
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/assessment/${p.assignmentExternalId}`)}
                  className="shrink-0 rounded-full border border-neutral-200 px-3 py-1 text-[12px] font-medium text-neutral-600 hover:border-[#ff6a2b] hover:text-[#ff6a2b] transition"
                >
                  View
                </button>
                <button
                  onClick={() => removePaper(group.externalId, p.assignmentExternalId)}
                  className="shrink-0 grid h-7 w-7 place-items-center rounded-full text-neutral-300 hover:bg-red-50 hover:text-red-500 transition"
                  title="Remove paper"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite code */}
      <div className="rounded-[24px] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
        <h3 className="mb-1 text-[16px] font-semibold text-[#1f1f1f]">Group Invite Code</h3>
        <p className="mb-4 text-[13px] text-neutral-500">Share this code with students so they can reference this group.</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1 rounded-[16px] border border-neutral-200 bg-[#fafafa] px-5 py-3">
            <span className="text-[20px] font-bold tracking-widest text-[#1f1f1f] sm:text-[22px]">{inviteCode}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyInvite}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-neutral-200 px-4 py-3 text-[13px] font-semibold text-neutral-600 hover:border-[#ff6a2b] hover:text-[#ff6a2b] transition sm:flex-none"
            >
              {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleRefreshInvite}
              disabled={refreshing}
              className="flex flex-1 items-center justify-center rounded-full border border-neutral-200 px-4 py-3 text-[13px] font-medium text-neutral-500 hover:bg-neutral-50 disabled:opacity-50 transition sm:flex-none"
            >
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GroupsPage() {
  const { groups, isLoading, error, fetchGroups, deleteGroup } = useGroupStore();
  const [showCreate, setShowCreate] = useState(false);
  const [assigningGroup, setAssigningGroup] = useState<Group | null>(null);
  const [viewingGroup, setViewingGroup] = useState<Group | null>(null);
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchGroups();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenFor(null);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keep viewingGroup in sync with store updates (e.g. after assignPaper)
  const derivedViewingGroup = useMemo(() => {
    if (!viewingGroup) return null;
    return groups.find((g) => g.externalId === viewingGroup.externalId) ?? viewingGroup;
  }, [groups, viewingGroup]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this group? This cannot be undone.')) return;
    await deleteGroup(id);
    setMenuOpenFor(null);
    if (viewingGroup?.externalId === id) setViewingGroup(null);
  }

  // Recent activity derived from real data
  const activity = [
    ...groups.flatMap((g) =>
      g.assignedPapers.slice(-2).map((p) => ({
        text: `"${p.assignmentTitle}" assigned to ${g.name}`,
        time: formatDate(p.assignedAt),
        dot: 'bg-blue-400'
      }))
    ),
    ...groups.slice(0, 3).map((g) => ({
      text: `Group "${g.name}" created`,
      time: formatDate(g.createdAt),
      dot: 'bg-green-400'
    }))
  ].slice(0, 5);

  return (
    <Shell title="My Groups" titleIcon={School2}>
      <div className="mx-auto max-w-[1100px] pb-10">
        {/* Header row */}
        <div className="mb-6 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[22px] font-bold text-[#1f1f1f] sm:text-[24px]">My Groups</h1>
            <p className="text-[13px] text-neutral-500 sm:text-[14px]">Organise students into class groups, assign papers, and track activity.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="shrink-0 flex items-center gap-2 rounded-full bg-[#1f1f1f] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-black sm:px-5 sm:text-[14px]"
          >
            <Plus className="h-4 w-4" /> <span className="hidden xs:inline">New </span>Group
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-[18px] border border-red-200 bg-red-50 px-5 py-3 text-[13px] text-red-600">{error}</div>
        )}

        {/* Detail view */}
        {derivedViewingGroup ? (
          <GroupDetail
            group={derivedViewingGroup}
            onBack={() => setViewingGroup(null)}
            onAssign={() => setAssigningGroup(derivedViewingGroup)}
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Groups list */}
            <div className="lg:col-span-2 space-y-4">
              {isLoading && groups.length === 0 ? (
                <div className="flex items-center justify-center py-20 text-neutral-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : groups.length === 0 ? (
                <div className="rounded-[24px] bg-white py-16 text-center shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
                  <School2 className="mx-auto mb-3 h-8 w-8 text-neutral-300" />
                  <p className="text-[15px] font-semibold text-neutral-400">No groups yet.</p>
                  <p className="mt-1 text-[13px] text-neutral-400">Create your first group to start organising your classes.</p>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="mt-4 rounded-full bg-[#1f1f1f] px-6 py-2.5 text-[14px] font-semibold text-white hover:bg-black"
                  >
                    + New Group
                  </button>
                </div>
              ) : (
                groups.map((g) => {
                  const color = COLORS[g.colorIdx ?? 0];
                  const nextDue = g.assignedPapers
                    .filter((p) => p.dueDate)
                    .map((p) => new Date(p.dueDate!))
                    .filter((d) => d > new Date())
                    .sort((a, b) => a.getTime() - b.getTime())[0];

                  return (
                    <div
                      key={g.externalId}
                      className="group rounded-[24px] bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition hover:shadow-[0_4px_18px_rgba(0,0,0,0.09)]"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-[18px] ${color.bg} text-[16px] font-bold text-white`}>
                          {initials(g.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-[16px] font-semibold text-[#1f1f1f] truncate">{g.name}</p>
                            {/* ⋮ menu */}
                            <div className="relative" ref={menuOpenFor === g.externalId ? menuRef : undefined}>
                              <button
                                onClick={() => setMenuOpenFor(menuOpenFor === g.externalId ? null : g.externalId)}
                                className="grid h-7 w-7 place-items-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-[#1f1f1f] lg:opacity-0 lg:group-hover:opacity-100"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                              {menuOpenFor === g.externalId && (
                                <div className="absolute right-0 top-8 z-20 w-36 rounded-[16px] bg-white py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.14)]">
                                  <button
                                    onClick={() => { setViewingGroup(g); setMenuOpenFor(null); }}
                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-[13px] text-neutral-700 hover:bg-neutral-50"
                                  >
                                    <ChevronRight className="h-3.5 w-3.5" /> View
                                  </button>
                                  <button
                                    onClick={() => handleDelete(g.externalId)}
                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-[13px] text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-[13px] text-neutral-500">{g.subject} · Class {g.className}</p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="rounded-[14px] bg-neutral-50 px-3 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-[12px] text-neutral-400 mb-1">
                            <Users className="h-3.5 w-3.5" /> Students
                          </div>
                          <div className="text-[18px] font-bold text-[#1f1f1f]">{g.studentCount}</div>
                        </div>
                        <div className="rounded-[14px] bg-neutral-50 px-3 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-[12px] text-neutral-400 mb-1">
                            <BookOpen className="h-3.5 w-3.5" /> Papers
                          </div>
                          <div className="text-[18px] font-bold text-[#1f1f1f]">{g.assignedPapers.length}</div>
                        </div>
                        <div className="rounded-[14px] bg-neutral-50 px-3 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-[12px] text-neutral-400 mb-1">
                            <Calendar className="h-3.5 w-3.5" /> Next Due
                          </div>
                          <div className="text-[15px] font-bold text-[#ff6a2b]">
                            {nextDue ? formatDate(nextDue.toISOString()) : '—'}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => setAssigningGroup(g)}
                          className="flex-1 rounded-full bg-[#1f1f1f] py-2 text-[13px] font-semibold text-white hover:bg-black transition"
                        >
                          Assign Paper
                        </button>
                        <button
                          onClick={() => setViewingGroup(g)}
                          className="flex-1 rounded-full border border-neutral-200 py-2 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 transition"
                        >
                          View Group
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Activity feed */}
            <div className="rounded-[24px] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.05)] h-fit">
              <h3 className="mb-4 text-[16px] font-semibold text-[#1f1f1f]">Recent Activity</h3>
              {activity.length === 0 ? (
                <p className="text-[13px] text-neutral-400 text-center py-4">No activity yet.</p>
              ) : (
                <div className="space-y-4">
                  {activity.map((a, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${a.dot}`} />
                      <div>
                        <p className="text-[13px] text-[#1f1f1f] leading-5">{a.text}</p>
                        <p className="text-[12px] text-neutral-400 mt-0.5">{a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 rounded-[16px] bg-[#fafafa] px-4 py-4 text-center">
                <p className="text-[13px] font-semibold text-neutral-600">Group summary</p>
                <p className="mt-1 text-[12px] text-neutral-400">
                  {groups.length} group{groups.length !== 1 ? 's' : ''} ·{' '}
                  {groups.reduce((s, g) => s + g.assignedPapers.length, 0)} papers assigned
                </p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-3 w-full rounded-full bg-[#ff6a2b] py-2 text-[13px] font-semibold text-white hover:bg-[#e55a1f] transition"
                >
                  + New Group
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onCreated={() => setShowCreate(false)}
        />
      )}
      {assigningGroup && (
        <AssignPaperModal
          group={assigningGroup}
          onClose={() => setAssigningGroup(null)}
        />
      )}
    </Shell>
  );
}
