'use client';

import { useState } from 'react';
import { Shell } from '@/components/shell';
import { BookMarked, BookOpen, Clock3, Download, FileText, Filter, Layers, Microscope, Search, Star, Zap } from 'lucide-react';

const TABS = [
  { id: 'saved', label: 'Saved Papers', icon: BookMarked },
  { id: 'questions', label: 'Question Bank', icon: FileText },
  { id: 'templates', label: 'Templates', icon: Layers }
];

const SAVED_PAPERS = [
  { id: 1, title: 'Quiz on Electricity', subject: 'Science', className: '8', marks: 20, questions: 10, starred: true, date: 'May 24' },
  { id: 2, title: 'Half-Yearly – Mathematics', subject: 'Mathematics', className: '9', marks: 80, questions: 30, starred: false, date: 'Apr 10' },
  { id: 3, title: 'Unit Test – Photosynthesis', subject: 'Biology', className: '9', marks: 30, questions: 15, starred: true, date: 'Mar 22' },
  { id: 4, title: 'Chemistry Practical Assessment', subject: 'Chemistry', className: '10', marks: 25, questions: 12, starred: false, date: 'Mar 5' }
];

const QUESTION_BANK = [
  { id: 1, text: 'Define electric current and state its SI unit.', subject: 'Science', type: 'Short', difficulty: 'Easy', marks: 2 },
  { id: 2, text: 'Explain the process of photosynthesis with a labelled diagram.', subject: 'Biology', type: 'Long', difficulty: 'Medium', marks: 5 },
  { id: 3, text: 'Solve: 2x + 3y = 12, x − y = 1', subject: 'Mathematics', type: 'Short', difficulty: 'Medium', marks: 3 },
  { id: 4, text: 'What is electroplating? Give two industrial uses.', subject: 'Science', type: 'Short', difficulty: 'Easy', marks: 2 },
  { id: 5, text: 'Describe the structure of DNA with a diagram.', subject: 'Biology', type: 'Long', difficulty: 'Hard', marks: 6 }
];

const TEMPLATES = [
  { id: 1, name: 'Unit Test (30 marks)', desc: '10 MCQ + 5 Short + 2 Long', subject: 'Any', icon: BookMarked, color: 'bg-violet-50 text-violet-600' },
  { id: 2, name: 'Half-Yearly (80 marks)', desc: '20 MCQ + 10 Short + 5 Long + 2 Case Study', subject: 'Any', icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
  { id: 3, name: 'Quick Quiz (20 marks)', desc: '5 MCQ + 5 Short Answer', subject: 'Any', icon: Zap, color: 'bg-amber-50 text-amber-600' },
  { id: 4, name: 'Practical Assessment', desc: '5 Observation + 3 Short + 1 Long', subject: 'Science', icon: Microscope, color: 'bg-emerald-50 text-emerald-600' }
];

const DIFF_COLOR: Record<string, string> = {
  Easy: 'bg-green-100 text-green-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Hard: 'bg-red-100 text-red-700'
};

export default function LibraryPage() {
  const [tab, setTab] = useState('saved');
  const [search, setSearch] = useState('');
  const [starred, setStarred] = useState<Set<number>>(new Set([1, 3]));

  function toggleStar(id: number) {
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const filteredPapers = SAVED_PAPERS.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) || p.subject.toLowerCase().includes(search.toLowerCase())
  );

  const filteredQuestions = QUESTION_BANK.filter((q) =>
    q.text.toLowerCase().includes(search.toLowerCase()) || q.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Shell title="My Library" titleIcon={Clock3}>
      <div className="mx-auto max-w-[1100px] pb-10">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[24px] font-bold text-[#1f1f1f]">My Library</h1>
            <p className="text-[14px] text-neutral-500">Your saved papers, question bank, and reusable templates.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search library…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-64 rounded-full border border-neutral-200 bg-white pl-11 pr-5 text-[14px] outline-none focus:border-[#ff6a2b] focus:ring-2 focus:ring-[#ff6a2b]/20"
              />
            </div>
            <button className="grid h-11 w-11 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-500 hover:text-[#1f1f1f]">
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-[20px] bg-white p-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.05)] w-fit">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-[14px] px-5 py-2.5 text-[14px] font-semibold transition ${tab === t.id ? 'bg-[#1f1f1f] text-white' : 'text-neutral-500 hover:text-[#1f1f1f]'}`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Saved Papers */}
        {tab === 'saved' && (
          <div className="space-y-3">
            {filteredPapers.map((p) => (
              <div key={p.id} className="flex items-center gap-4 rounded-[24px] bg-white px-6 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition hover:shadow-[0_4px_18px_rgba(0,0,0,0.09)]">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-neutral-100 text-neutral-500">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-[#1f1f1f] truncate">{p.title}</p>
                  <p className="text-[13px] text-neutral-500">{p.subject} · Class {p.className} · {p.questions} questions · {p.marks} marks</p>
                </div>
                <span className="shrink-0 text-[12px] text-neutral-400">{p.date}</span>
                <button onClick={() => toggleStar(p.id)} className="shrink-0">
                  <Star className={`h-5 w-5 transition ${starred.has(p.id) ? 'fill-amber-400 text-amber-400' : 'text-neutral-300 hover:text-amber-300'}`} />
                </button>
                <button className="shrink-0 grid h-9 w-9 place-items-center rounded-full border border-neutral-200 text-neutral-500 hover:border-[#ff6a2b] hover:text-[#ff6a2b]">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            ))}
            {filteredPapers.length === 0 && (
              <div className="rounded-[24px] bg-white py-16 text-center text-neutral-400 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
                No papers match your search.
              </div>
            )}
          </div>
        )}

        {/* Question Bank */}
        {tab === 'questions' && (
          <div className="space-y-3">
            {filteredQuestions.map((q) => (
              <div key={q.id} className="rounded-[24px] bg-white px-6 py-5 shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition hover:shadow-[0_4px_18px_rgba(0,0,0,0.09)]">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-[15px] leading-7 text-[#1f1f1f]">{q.text}</p>
                  <span className="shrink-0 text-[13px] font-semibold text-neutral-500">({q.marks}M)</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-600">{q.subject}</span>
                  <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-600">{q.type}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${DIFF_COLOR[q.difficulty] ?? 'bg-neutral-100 text-neutral-600'}`}>{q.difficulty}</span>
                </div>
              </div>
            ))}
            {filteredQuestions.length === 0 && (
              <div className="rounded-[24px] bg-white py-16 text-center text-neutral-400 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
                No questions match your search.
              </div>
            )}
          </div>
        )}

        {/* Templates */}
        {tab === 'templates' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TEMPLATES.map((t) => (
              <div key={t.id} className="group rounded-[28px] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition hover:shadow-[0_4px_18px_rgba(0,0,0,0.09)] hover:-translate-y-0.5 cursor-pointer">
                <div className={`grid h-12 w-12 place-items-center rounded-[14px] ${t.color}`}>
                  <t.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-3 text-[16px] font-semibold text-[#1f1f1f]">{t.name}</h3>
                <p className="mt-1 text-[13px] text-neutral-500">{t.desc}</p>
                <span className="mt-3 inline-block rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] text-neutral-500">{t.subject}</span>
                <button className="mt-4 w-full rounded-full bg-[#1f1f1f] py-2 text-[13px] font-semibold text-white opacity-0 group-hover:opacity-100 transition">
                  Use Template
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
