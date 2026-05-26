'use client';

import { useState } from 'react';
import { Shell } from '@/components/shell';
import { School2, Plus, Users, BookOpen, Calendar, MoreHorizontal } from 'lucide-react';

const GROUPS = [
  { id: 1, name: 'Class 8A – Science', subject: 'Science', students: 34, color: 'bg-blue-500', initial: '8A', assignmentsCount: 5, nextDue: 'Jun 2' },
  { id: 2, name: 'Class 9B – Biology', subject: 'Biology', students: 28, color: 'bg-emerald-500', initial: '9B', assignmentsCount: 3, nextDue: 'Jun 5' },
  { id: 3, name: 'Class 10A – Chemistry', subject: 'Chemistry', students: 31, color: 'bg-violet-500', initial: '10A', assignmentsCount: 7, nextDue: 'Jun 8' },
  { id: 4, name: 'Class 8B – Science', subject: 'Science', students: 30, color: 'bg-amber-500', initial: '8B', assignmentsCount: 4, nextDue: 'Jun 10' }
];

const ACTIVITY = [
  { text: 'Class 8A completed "Quiz on Electricity"', time: '2 hours ago', dot: 'bg-green-400' },
  { text: 'Class 9B assigned "Chapter Test – Photosynthesis"', time: 'Yesterday', dot: 'bg-blue-400' },
  { text: 'Class 10A joined the group', time: '3 days ago', dot: 'bg-violet-400' }
];

export default function GroupsPage() {
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');

  return (
    <Shell title="My Groups" titleIcon={School2}>
      <div className="mx-auto max-w-[1100px] pb-10">
        {/* Header row */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-[24px] font-bold text-[#1f1f1f]">My Groups</h1>
            <p className="text-[14px] text-neutral-500">Organise students into class groups, assign papers, and track activity.</p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 rounded-full bg-[#1f1f1f] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-black"
          >
            <Plus className="h-4 w-4" /> New Group
          </button>
        </div>

        {/* New group form */}
        {showNew && (
          <div className="mb-6 rounded-[24px] border border-neutral-200 bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
            <h3 className="mb-4 text-[16px] font-semibold">Create a new group</h3>
            <input
              type="text"
              placeholder="e.g. Class 9A – Mathematics"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-12 w-full rounded-full border border-neutral-200 bg-[#f8f8f8] px-5 text-[15px] outline-none focus:border-[#ff6a2b] focus:ring-2 focus:ring-[#ff6a2b]/20"
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowNew(false)}
                className="rounded-full bg-[#1f1f1f] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-black"
              >
                Create Group
              </button>
              <button onClick={() => setShowNew(false)} className="rounded-full border border-neutral-200 px-5 py-2.5 text-[14px] font-medium text-neutral-600 hover:bg-neutral-50">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Groups */}
          <div className="lg:col-span-2 space-y-4">
            {GROUPS.map((g) => (
              <div key={g.id} className="group rounded-[24px] bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition hover:shadow-[0_4px_18px_rgba(0,0,0,0.09)]">
                <div className="flex items-center gap-4">
                  <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-[18px] ${g.color} text-[18px] font-bold text-white`}>
                    {g.initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[16px] font-semibold text-[#1f1f1f] truncate">{g.name}</p>
                      <button className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-[#1f1f1f]">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </div>
                    <p className="text-[13px] text-neutral-500">{g.subject}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-[14px] bg-neutral-50 px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-[12px] text-neutral-400 mb-1">
                      <Users className="h-3.5 w-3.5" /> Students
                    </div>
                    <div className="text-[18px] font-bold text-[#1f1f1f]">{g.students}</div>
                  </div>
                  <div className="rounded-[14px] bg-neutral-50 px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-[12px] text-neutral-400 mb-1">
                      <BookOpen className="h-3.5 w-3.5" /> Papers
                    </div>
                    <div className="text-[18px] font-bold text-[#1f1f1f]">{g.assignmentsCount}</div>
                  </div>
                  <div className="rounded-[14px] bg-neutral-50 px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-[12px] text-neutral-400 mb-1">
                      <Calendar className="h-3.5 w-3.5" /> Next Due
                    </div>
                    <div className="text-[15px] font-bold text-[#ff6a2b]">{g.nextDue}</div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 rounded-full bg-[#1f1f1f] py-2 text-[13px] font-semibold text-white hover:bg-black">
                    Assign Paper
                  </button>
                  <button className="flex-1 rounded-full border border-neutral-200 py-2 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50">
                    View Group
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Activity feed */}
          <div className="rounded-[24px] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.05)] h-fit">
            <h3 className="mb-4 text-[16px] font-semibold text-[#1f1f1f]">Recent Activity</h3>
            <div className="space-y-4">
              {ACTIVITY.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${a.dot}`} />
                  <div>
                    <p className="text-[13px] text-[#1f1f1f] leading-5">{a.text}</p>
                    <p className="text-[12px] text-neutral-400 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-[16px] bg-[#fafafa] px-4 py-4 text-center">
              <p className="text-[13px] font-semibold text-neutral-600">Invite students via link</p>
              <p className="mt-1 text-[12px] text-neutral-400">Share a group code so students can self-join</p>
              <button className="mt-3 w-full rounded-full bg-[#ff6a2b] py-2 text-[13px] font-semibold text-white hover:bg-[#e55a1f]">
                Generate Invite Link
              </button>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
