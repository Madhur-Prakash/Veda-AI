'use client';

import { useEffect, use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, RefreshCw, Copy, FileText, Printer, Eye, EyeOff } from 'lucide-react';
import { Shell } from '@/components/shell';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useGenerationStore } from '@/store/generationStore';
import type { GenerationQuestion } from '@/types';

const DIFF_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  Easy: { bg: 'bg-green-100', text: 'text-green-700', label: 'Easy' },
  Medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Medium' },
  Hard: { bg: 'bg-red-100', text: 'text-red-700', label: 'Hard' }
};

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const style = DIFF_BADGE[difficulty] ?? { bg: 'bg-neutral-100', text: 'text-neutral-600', label: difficulty };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}

function QuestionCard({ q, index, showAnswer }: { q: GenerationQuestion; index: number; showAnswer: boolean }) {
  return (
    <li className="rounded-[20px] border border-neutral-100 bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <span className="text-[13px] font-bold text-[#ff6a2b]">Q{index + 1}.</span>
          <span className="ml-2 text-[15px] leading-7 text-[#1f1f1f]">{q.question}</span>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-[13px] font-semibold text-neutral-600">({q.marks} {q.marks === 1 ? 'Mark' : 'Marks'})</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <DifficultyBadge difficulty={q.difficulty} />
        <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-500">{q.type}</span>
        {q.blooms_level && (
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-600">{q.blooms_level}</span>
        )}
        {q.estimated_time && (
          <span className="text-[11px] text-neutral-400">~{q.estimated_time}</span>
        )}
      </div>
      {showAnswer && q.answer_key && (
        <div className="mt-4 rounded-[14px] border border-green-100 bg-green-50 px-4 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-green-700">Answer: </span>
          <span className="text-[14px] leading-6 text-green-900">{q.answer_key}</span>
        </div>
      )}
    </li>
  );
}

export default function AssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { currentAssignment, fetchAssignment, isLoading, regenerate, error } = useAssignmentStore();
  const { setQueued } = useGenerationStore();
  const [copyDone, setCopyDone] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    fetchAssignment(id);
  }, [id, fetchAssignment]);

  const a = currentAssignment;
  const assessment = a?.generatedAssessment;

  const totalQuestions = assessment?.sections.reduce((s, sec) => s + sec.questions.length, 0) ?? 0;
  const totalSections = assessment?.sections.length ?? 0;

  function handleDownload() {
    const token = localStorage.getItem('accessToken');
    const url = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/assignments/${id}/export/pdf`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `assessment-${id}.pdf`;
        link.click();
      });
  }

  async function handleRegenerate() {
    setIsRegenerating(true);
    try {
      const result = await regenerate(id);
      setQueued(id, `generation:${id}:${result.jobId}`);
      router.push(`/generation-status?id=${id}`);
    } catch {
      return;
    } finally {
      setIsRegenerating(false);
    }
  }

  function handleCopy() {
    if (!assessment) return;
    const text = assessment.sections.map((s) =>
      `${s.title}\n${s.instruction}\n\n${s.questions.map((q, i) => `Q${i + 1}. ${q.question} (${q.marks} marks)`).join('\n')}`
    ).join('\n\n---\n\n');
    navigator.clipboard.writeText(text);
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 2000);
  }

  if (isLoading) {
    return (
      <Shell title="Assessment" titleIcon={FileText}>
        <div className="mx-auto max-w-[1100px] space-y-4 pb-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-[28px] bg-white/80" />
          ))}
        </div>
      </Shell>
    );
  }

  if (!a || !assessment) {
    return (
      <Shell title="Assessment" titleIcon={FileText}>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <p className="text-[18px] font-semibold text-neutral-500">Assessment not found or still generating.</p>
          <button onClick={() => router.back()} className="rounded-full border border-neutral-300 px-5 py-2.5 text-[14px] font-medium hover:bg-neutral-50">
            Go back
          </button>
        </div>
      </Shell>
    );
  }

  const currentAssessment = assessment;

  return (
    <Shell title={a.title} titleIcon={FileText}>
      <div className="mx-auto w-full max-w-[1100px] px-1 pb-10 md:px-0">
        {/* Action bar */}
        <section className="rounded-[34px] bg-[#282828] p-6 text-white shadow-[0_2px_12px_rgba(0,0,0,0.16)] md:p-8">
          <p className="max-w-5xl text-[17px] font-semibold leading-8 md:text-[20px]">
            {a.title} — {a.subject}, Class {a.className}
          </p>
          <p className="mt-1 text-[14px] text-neutral-400">Topic: {a.topic} · {totalSections} sections · {totalQuestions} questions · {a.totalMarks} marks</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[14px] font-semibold text-[#1f1f1f] shadow-sm hover:bg-white/90"
            >
              <Download className="h-4 w-4" /> Download PDF
            </button>
            <button
              onClick={() => setShowAnswers(!showAnswers)}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold transition ${showAnswers ? 'bg-green-500 text-white' : 'border border-white/20 text-white hover:bg-white/10'}`}
            >
              {showAnswers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showAnswers ? 'Hide Answers' : 'Show Answers'}
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-white/10"
            >
              <Copy className="h-4 w-4" /> {copyDone ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-white/10"
            >
              <Printer className="h-4 w-4" /> Print
            </button>
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-white/10 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
          </div>
          {error && (
            <div className="mt-4 max-w-3xl rounded-[18px] border border-red-300 bg-red-500/10 px-4 py-3 text-[14px] text-red-100" role="alert" aria-live="polite">
              {error}
            </div>
          )}
        </section>

        {/* Question paper */}
        <section className="mt-4 rounded-[34px] bg-white px-8 py-9 shadow-[0_4px_20px_rgba(0,0,0,0.06)] print:shadow-none md:px-16 md:py-12">
          {/* Header */}
          <div className="border-b border-neutral-200 pb-6 text-center">
            <h1 className="font-display text-[26px] font-semibold tracking-tight md:text-[36px]">{a.title}</h1>
            <p className="mt-1 text-[16px] font-semibold md:text-[22px]">Subject: {a.subject}</p>
            <p className="text-[16px] font-semibold md:text-[22px]">Class: {a.className}</p>
          </div>

          <div className="mt-5 flex items-start justify-between text-[14px] md:text-[16px]">
            <span><strong>Time Allowed:</strong> {a.durationMinutes} minutes</span>
            <span><strong>Maximum Marks:</strong> {a.totalMarks}</span>
          </div>

          <div className="mt-5 space-y-1 text-[14px] md:text-[16px]">
            <p><strong>Name:</strong> _________________________________</p>
            <p><strong>Roll Number:</strong> __________________________</p>
            <p><strong>Section:</strong> _______________________________</p>
          </div>

          {/* Sections */}
          {currentAssessment.sections.map((section, si) => (
            <div key={si} className="mt-12 border-t border-neutral-100 pt-10">
              <div className="text-center">
                <h2 className="font-display text-[22px] font-semibold md:text-[30px]">{section.title}</h2>
                {section.instruction && (
                  <p className="mt-1 text-[13px] italic text-neutral-500 md:text-[15px]">{section.instruction}</p>
                )}
              </div>

              <ul className="mt-6 space-y-4">
                {section.questions.map((q, qi) => (
                  <QuestionCard key={q.id ?? qi} q={q} index={qi} showAnswer={showAnswers} />
                ))}
              </ul>
            </div>
          ))}

          <p className="mt-12 text-center text-[14px] font-semibold text-neutral-500">— End of Question Paper —</p>

          {/* Answer Key */}
          <div className="mt-12 border-t border-neutral-200 pt-10">
            <h3 className="text-[20px] font-semibold md:text-[26px]">Answer Key</h3>
            <div className="mt-6 space-y-8">
              {currentAssessment.sections.map((section, si) => (
                <div key={si}>
                  <h4 className="mb-3 text-[16px] font-semibold text-neutral-600">{section.title}</h4>
                  <ol className="space-y-3">
                    {section.questions.map((q, qi) => (
                      <li key={q.id ?? qi} className="rounded-[16px] bg-[#fafafa] px-4 py-3 text-[14px] leading-7">
                        <span className="font-bold text-[#ff6a2b]">Q{qi + 1}.</span>{' '}
                        <span className="text-neutral-700">{q.answer_key}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 grid gap-4 rounded-[28px] bg-[#fafafa] p-5 md:grid-cols-4">
              {[
              { label: 'Sections', value: String(currentAssessment.sections.length) },
              { label: 'Questions', value: String(currentAssessment.sections.reduce((sum, section) => sum + section.questions.length, 0)) },
              { label: 'Total Marks', value: String(a.totalMarks) },
              { label: 'Duration', value: `${a.durationMinutes} min` }
            ].map(({ label, value }) => (
              <div key={label} className="rounded-[20px] bg-white px-4 py-4 text-center shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">{label}</div>
                <div className="mt-1.5 font-display text-[28px] font-semibold text-[#1f1f1f]">{value}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}
