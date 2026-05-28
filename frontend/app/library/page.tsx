'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '@/components/shell';
import {
  BookMarked, BookOpen, Clock3, Download, FileText,
  Filter, Layers, Loader2, Microscope, Search, Star, Zap, X
} from 'lucide-react';
import { assignmentApi } from '@/lib/api';
import type { Assignment, GenerationQuestion } from '@/types';

const TABS = [
  { id: 'saved', label: 'Saved Papers', icon: BookMarked },
  { id: 'questions', label: 'Question Bank', icon: FileText },
  { id: 'templates', label: 'Templates', icon: Layers }
];

const TEMPLATES = [
  {
    id: 'unit_test',
    name: 'Unit Test (30 marks)',
    desc: '10 MCQ + 5 Short + 2 Long',
    subject: 'Any',
    icon: BookMarked,
    color: 'bg-violet-50 text-violet-600'
  },
  {
    id: 'half_yearly',
    name: 'Half-Yearly (80 marks)',
    desc: '20 MCQ + 10 Short + 5 Long + 2 Case Study',
    subject: 'Any',
    icon: BookOpen,
    color: 'bg-blue-50 text-blue-600'
  },
  {
    id: 'quick_quiz',
    name: 'Quick Quiz (20 marks)',
    desc: '5 MCQ + 5 Short Answer',
    subject: 'Any',
    icon: Zap,
    color: 'bg-amber-50 text-amber-600'
  },
  {
    id: 'practical',
    name: 'Practical Assessment',
    desc: '5 Short + 2 Long',
    subject: 'Science',
    icon: Microscope,
    color: 'bg-emerald-50 text-emerald-600'
  }
];

const DIFF_COLOR: Record<string, string> = {
  Easy: 'bg-green-100 text-green-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Hard: 'bg-red-100 text-red-700'
};

const SUBJECTS = ['All Subjects', 'Science', 'Mathematics', 'Biology', 'Chemistry', 'Physics', 'English', 'History'];

interface ExtractedQuestion extends GenerationQuestion {
  subject: string;
  assignmentTitle: string;
}

async function downloadPdf(externalId: string, title: string) {
  const response = await assignmentApi.exportPdf(externalId);
  const blob = new Blob([response.data as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function LibraryPage() {
  const router = useRouter();
  const [tab, setTab] = useState('saved');
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All Subjects');
  const [showFilter, setShowFilter] = useState(false);
  const [starred, setStarred] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState<string | null>(null);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    assignmentApi.list()
      .then(({ data }) => {
        const list: Assignment[] = data.data ?? data ?? [];
        setAssignments(list);
      })
      .catch(() => setFetchError('Could not load your library. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  function toggleStar(id: string) {
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleDownload(assignment: Assignment) {
    setDownloading(assignment.externalId);
    try {
      await downloadPdf(assignment.externalId, assignment.title);
    } catch {
      alert('PDF not available yet. Please wait until the assessment is fully generated.');
    } finally {
      setDownloading(null);
    }
  }

  function navigateToTemplate(templateId: string) {
    router.push(`/create-assignment?template=${templateId}`);
  }

  const completedAssignments = assignments.filter((a) => a.status === 'COMPLETED');

  const filteredPapers = completedAssignments.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.subject.toLowerCase().includes(search.toLowerCase());
    const matchesSubject =
      subjectFilter === 'All Subjects' || a.subject.toLowerCase() === subjectFilter.toLowerCase();
    return matchesSearch && matchesSubject;
  });

  const allQuestions: ExtractedQuestion[] = completedAssignments.flatMap((a) =>
    (a.generatedAssessment?.sections ?? []).flatMap((s) =>
      s.questions.map((q) => ({ ...q, subject: a.subject, assignmentTitle: a.title }))
    )
  );

  const filteredQuestions = allQuestions.filter((q) => {
    const matchesSearch =
      q.question.toLowerCase().includes(search.toLowerCase()) ||
      q.subject.toLowerCase().includes(search.toLowerCase());
    const matchesSubject =
      subjectFilter === 'All Subjects' || q.subject.toLowerCase() === subjectFilter.toLowerCase();
    return matchesSearch && matchesSubject;
  });

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function totalQuestions(a: Assignment) {
    return (a.generatedAssessment?.sections ?? []).reduce((s, sec) => s + sec.questions.length, 0);
  }

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
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search library…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded-full border border-neutral-200 bg-white pl-11 pr-5 text-[14px] outline-none focus:border-[#ff6a2b] focus:ring-2 focus:ring-[#ff6a2b]/20 sm:w-56"
              />
            </div>
            <div className="relative shrink-0">
              <button
                onClick={() => setShowFilter((v) => !v)}
                className={`grid h-11 w-11 place-items-center rounded-full border bg-white transition ${showFilter || subjectFilter !== 'All Subjects' ? 'border-[#ff6a2b] text-[#ff6a2b]' : 'border-neutral-200 text-neutral-500 hover:text-[#1f1f1f]'}`}
              >
                {subjectFilter !== 'All Subjects' ? <X className="h-4 w-4" onClick={(e) => { e.stopPropagation(); setSubjectFilter('All Subjects'); setShowFilter(false); }} /> : <Filter className="h-4 w-4" />}
              </button>
              {showFilter && (
                <div className="absolute right-0 top-[52px] z-20 w-52 rounded-[20px] bg-white py-2 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
                  {SUBJECTS.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSubjectFilter(s); setShowFilter(false); }}
                      className={`w-full px-5 py-2.5 text-left text-[14px] transition hover:bg-[#fafafa] ${subjectFilter === s ? 'font-semibold text-[#ff6a2b]' : 'text-neutral-700'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex w-full gap-1 overflow-x-auto rounded-[20px] bg-white p-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-2 rounded-[14px] px-4 py-2.5 text-[13px] font-semibold transition sm:px-5 sm:text-[14px] ${tab === t.id ? 'bg-[#1f1f1f] text-white' : 'text-neutral-500 hover:text-[#1f1f1f]'}`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && tab !== 'templates' && (
          <div className="flex items-center justify-center py-20 text-neutral-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {/* Fetch error */}
        {fetchError && (
          <div className="rounded-[20px] border border-red-200 bg-red-50 px-5 py-4 text-[14px] text-red-600">{fetchError}</div>
        )}

        {/* Saved Papers */}
        {!loading && tab === 'saved' && (
          <div className="space-y-3">
            {filteredPapers.length === 0 ? (
              <div className="rounded-[24px] bg-white py-16 text-center shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
                <FileText className="mx-auto mb-3 h-8 w-8 text-neutral-300" />
                <p className="text-[15px] font-semibold text-neutral-400">
                  {completedAssignments.length === 0 ? 'No completed assessments yet.' : 'No papers match your search.'}
                </p>
                {completedAssignments.length === 0 && (
                  <p className="mt-1 text-[13px] text-neutral-400">Create your first assessment to see it here.</p>
                )}
              </div>
            ) : (
              filteredPapers.map((a) => (
                <div
                  key={a.externalId}
                  className="flex flex-col gap-3 rounded-[24px] bg-white px-5 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition hover:shadow-[0_4px_18px_rgba(0,0,0,0.09)] sm:flex-row sm:items-center sm:gap-4 sm:px-6"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-neutral-100 text-neutral-500 sm:h-12 sm:w-12">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-[#1f1f1f] truncate">{a.title}</p>
                    <p className="text-[13px] text-neutral-500">
                      {a.subject} · Class {a.className} · {totalQuestions(a)} questions · {a.totalMarks} marks
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:contents">
                    <span className="text-[12px] text-neutral-400">{formatDate(a.createdAt)}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleStar(a.externalId)} className="shrink-0">
                        <Star className={`h-5 w-5 transition ${starred.has(a.externalId) ? 'fill-amber-400 text-amber-400' : 'text-neutral-300 hover:text-amber-300'}`} />
                      </button>
                      <button
                        onClick={() => handleDownload(a)}
                        disabled={downloading === a.externalId}
                        className="shrink-0 grid h-9 w-9 place-items-center rounded-full border border-neutral-200 text-neutral-500 hover:border-[#ff6a2b] hover:text-[#ff6a2b] disabled:opacity-50 transition"
                        title="Download PDF"
                      >
                        {downloading === a.externalId
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Download className="h-4 w-4" />
                        }
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Question Bank */}
        {!loading && tab === 'questions' && (
          <div className="space-y-3">
            {allQuestions.length === 0 ? (
              <div className="rounded-[24px] bg-white py-16 text-center shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
                <FileText className="mx-auto mb-3 h-8 w-8 text-neutral-300" />
                <p className="text-[15px] font-semibold text-neutral-400">No questions in your bank yet.</p>
                <p className="mt-1 text-[13px] text-neutral-400">Questions from completed assessments will appear here.</p>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="rounded-[24px] bg-white py-16 text-center text-neutral-400 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
                No questions match your search.
              </div>
            ) : (
              filteredQuestions.map((q, idx) => (
                <div
                  key={`${q.id}-${idx}`}
                  className="rounded-[24px] bg-white px-6 py-5 shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition hover:shadow-[0_4px_18px_rgba(0,0,0,0.09)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-[15px] leading-7 text-[#1f1f1f]">{q.question}</p>
                    <span className="shrink-0 text-[13px] font-semibold text-neutral-500">({q.marks}M)</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-600">{q.subject}</span>
                    <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-600">{q.type}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${DIFF_COLOR[q.difficulty] ?? 'bg-neutral-100 text-neutral-600'}`}>{q.difficulty}</span>
                    {q.blooms_level && (
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-600">{q.blooms_level}</span>
                    )}
                  </div>
                  <p className="mt-2 text-[12px] text-neutral-400">From: {q.assignmentTitle}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Templates */}
        {tab === 'templates' && (
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {TEMPLATES.map((t) => (
              <div
                key={t.id}
                className="group rounded-[28px] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition hover:shadow-[0_4px_18px_rgba(0,0,0,0.09)] hover:-translate-y-0.5"
              >
                <div className={`grid h-12 w-12 place-items-center rounded-[14px] ${t.color}`}>
                  <t.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-3 text-[16px] font-semibold text-[#1f1f1f]">{t.name}</h3>
                <p className="mt-1 text-[13px] text-neutral-500">{t.desc}</p>
                <span className="mt-3 inline-block rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] text-neutral-500">{t.subject}</span>
                  <button
                  onClick={() => navigateToTemplate(t.id)}
                  className="mt-4 w-full rounded-full bg-[#1f1f1f] py-2 text-[13px] font-semibold text-white opacity-0 group-hover:opacity-100 transition hover:bg-black"
                >
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
