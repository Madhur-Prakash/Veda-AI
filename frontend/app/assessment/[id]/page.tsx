'use client';

import { useEffect, use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, RefreshCw, Copy, FileText, Printer, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Shell } from '@/components/shell';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useGenerationStore } from '@/store/generationStore';
import { assignmentApi } from '@/lib/api';
import type { GenerationQuestion } from '@/types';

const DIFF_LABEL: Record<string, string> = {
  Easy: 'Easy',
  Medium: 'Moderate',
  Hard: 'Challenging',
};

function QuestionRow({
  q,
  index,
  showAnswer,
}: {
  q: GenerationQuestion;
  index: number;
  showAnswer: boolean;
}) {
  const diffLabel = DIFF_LABEL[q.difficulty] ?? q.difficulty;
  return (
    <li className="py-1.5">
      <p className="text-[15px] font-medium leading-7 text-[#1a1a1a]">
        <span className="font-bold">{index + 1}.</span>{' '}
        {q.difficulty && (
          <span className="text-[14px] font-semibold text-neutral-600">[{diffLabel}]</span>
        )}{' '}
        {q.question}{' '}
        <span className="font-bold text-[#1a1a1a]">[{q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}]</span>
      </p>
      {showAnswer && q.answer_key && (
        <p className="ml-5 mt-1 text-[14px] font-medium text-neutral-700 italic">
          <span className="font-bold not-italic text-neutral-800">Ans: </span>
          {q.answer_key}
        </p>
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
  const [isDownloading, setIsDownloading] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    fetchAssignment(id);
  }, [id, fetchAssignment]);

  const a = currentAssignment;
  const assessment = a?.generatedAssessment;

  const totalQuestions = assessment?.sections.reduce((s, sec) => s + sec.questions.length, 0) ?? 0;
  const totalSections = assessment?.sections.length ?? 0;

  async function handleDownload() {
    if (!a) return;
    setIsDownloading(true);
    try {
      const response = await assignmentApi.exportPdf(id);
      const blob = new Blob([response.data as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${a.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
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
    const text = assessment.sections
      .map(
        (s) =>
          `${s.title}\n${s.instruction}\n\n${s.questions
            .map((q, i) => `${i + 1}. ${q.question} [${q.marks} marks]`)
            .join('\n')}`
      )
      .join('\n\n---\n\n');
    navigator.clipboard.writeText(text);
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 2000);
  }

  if (isLoading) {
    return (
      <Shell title="Assessment" titleIcon={FileText}>
        <div className="mx-auto max-w-[860px] space-y-4 pb-10">
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
          <button
            onClick={() => router.back()}
            className="rounded-full border border-neutral-300 px-5 py-2.5 text-[14px] font-medium hover:bg-neutral-50"
          >
            Go back
          </button>
        </div>
      </Shell>
    );
  }

  const currentAssessment = assessment;

  /* ── school name derived from title or fallback ── */
  const schoolName = a.schoolName ?? 'School Name';

  return (
    <Shell title={a.title} titleIcon={FileText}>
      <div className="mx-auto w-full max-w-[900px] px-2 pb-12 md:px-0">

        {/* ── Toolbar ── */}
        <section className="mb-5 rounded-[28px] bg-[#1e1e1e] px-6 py-5 text-white shadow-lg print:hidden">
          <p className="text-[16px] font-semibold">
            {a.title} — {a.subject}, Class {a.className}
          </p>
          <p className="mt-0.5 text-[13px] text-neutral-400">
            Topic: {a.topic} · {totalSections} sections · {totalQuestions} questions · {a.totalMarks} marks
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-[#1a1a1a] shadow-sm hover:bg-white/90 disabled:opacity-70"
            >
              {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isDownloading ? 'Downloading…' : 'Download PDF'}
            </button>
            <button
              onClick={() => setShowAnswers(!showAnswers)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                showAnswers ? 'bg-emerald-500 text-white' : 'border border-white/20 text-white hover:bg-white/10'
              }`}
            >
              {showAnswers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showAnswers ? 'Hide Answers' : 'Show Answers'}
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-[13px] font-semibold text-white hover:bg-white/10"
            >
              <Copy className="h-4 w-4" />
              {copyDone ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-[13px] font-semibold text-white hover:bg-white/10"
            >
              <Printer className="h-4 w-4" /> Print
            </button>
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-[13px] font-semibold text-white hover:bg-white/10 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
          </div>
          {error && (
            <div className="mt-3 rounded-2xl border border-red-300 bg-red-500/10 px-4 py-2.5 text-[13px] text-red-100">
              {error}
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════
            PRINTED EXAM PAPER
        ══════════════════════════════════════════ */}
        <article
          className="
            bg-white
            px-10 py-10
            shadow-[0_2px_24px_rgba(0,0,0,0.08)]
            print:shadow-none
            md:px-16 md:py-14
          "
          style={{ fontFamily: "'Times New Roman', Times, serif" }}
        >

          {/* ── Paper Header ── */}
          <header className="border-b-2 border-[#1a1a1a] pb-4 text-center">
            <h1 className="text-[24px] font-extrabold leading-tight tracking-tight text-[#1a1a1a] md:text-[28px]">
              {schoolName}
            </h1>
            <p className="mt-1 text-[16px] font-bold text-[#1a1a1a] md:text-[18px]">
              Subject: {a.subject}
            </p>
            <p className="text-[16px] font-bold text-[#1a1a1a] md:text-[18px]">
              Class: {a.className}
            </p>
          </header>

          {/* ── Meta row ── */}
          <div className="mt-4 flex items-start justify-between text-[14px] font-bold text-[#1a1a1a] md:text-[15px]">
            <span>Time Allowed: {a.durationMinutes} minutes</span>
            <span>Maximum Marks: {a.totalMarks}</span>
          </div>

          {/* ── General instruction ── */}
          {currentAssessment.instructions && (
            <p className="mt-3 text-[14px] font-bold text-[#1a1a1a]">
              {currentAssessment.instructions}
            </p>
          )}

          {/* ── Student fields ── */}
          <div className="mt-4 space-y-2 text-[14px] font-semibold text-[#1a1a1a] md:text-[15px]">
            <p>Name: <span className="inline-block w-40 border-b border-[#1a1a1a]">&nbsp;</span></p>
            <p>Roll Number: <span className="inline-block w-32 border-b border-[#1a1a1a]">&nbsp;</span></p>
            <p>
              Class: {a.className}&nbsp;&nbsp;Section:{' '}
              <span className="inline-block w-20 border-b border-[#1a1a1a]">&nbsp;</span>
            </p>
          </div>

          {/* ── Sections ── */}
          {currentAssessment.sections.map((section, si) => (
            <section key={si} className="mt-10">

              {/* Section heading */}
              <div className="mb-3 text-center">
                <h2 className="text-[17px] font-extrabold uppercase tracking-widest text-[#1a1a1a] md:text-[19px]">
                  {section.title}
                </h2>
                {section.instruction && (
                  <p className="mt-0.5 text-[14px] font-bold text-[#1a1a1a]">
                    {section.instruction}
                  </p>
                )}
                {section.marksPerQuestion && (
                  <p className="mt-0.5 text-[13px] font-semibold italic text-neutral-600">
                    Each question carries {section.marksPerQuestion} mark{section.marksPerQuestion !== 1 ? 's' : ''}.
                  </p>
                )}
              </div>

              {/* Questions */}
              <ol className="space-y-1.5 list-none">
                {section.questions.map((q, qi) => (
                  <QuestionRow key={q.id ?? qi} q={q} index={qi} showAnswer={showAnswers} />
                ))}
              </ol>
            </section>
          ))}

          {/* ── End of paper ── */}
          <p className="mt-12 text-center text-[14px] font-extrabold uppercase tracking-widest text-[#1a1a1a]">
            End of Question Paper
          </p>

          {/* ── Answer Key (visible when toggled) ── */}
          {showAnswers && (
            <section className="mt-12 border-t-2 border-[#1a1a1a] pt-8 print:hidden">
              <h3 className="mb-5 text-[18px] font-extrabold text-[#1a1a1a]">Answer Key</h3>
              {currentAssessment.sections.map((section, si) => (
                <div key={si} className="mb-8">
                  <h4 className="mb-2 text-[15px] font-extrabold text-[#1a1a1a]">{section.title}</h4>
                  <ol className="space-y-2 list-none">
                    {section.questions.map((q, qi) => (
                      <li key={q.id ?? qi} className="text-[14px] font-medium leading-6 text-[#1a1a1a]">
                        <span className="font-bold">{qi + 1}.</span>{' '}
                        {q.answer_key ?? <em className="text-neutral-400">No answer provided</em>}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </section>
          )}
        </article>

        {/* ── Stats strip (below the paper, not printed) ── */}
        <div className="mt-5 grid grid-cols-2 gap-3 print:hidden sm:grid-cols-4">
          {[
            { label: 'Sections', value: String(currentAssessment.sections.length) },
            {
              label: 'Questions',
              value: String(
                currentAssessment.sections.reduce((sum, s) => sum + s.questions.length, 0)
              ),
            },
            { label: 'Total Marks', value: String(a.totalMarks) },
            { label: 'Duration', value: `${a.durationMinutes} min` },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-[20px] bg-white px-4 py-4 text-center shadow-[0_1px_6px_rgba(0,0,0,0.05)]"
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                {label}
              </div>
              <div className="mt-1 text-[26px] font-bold text-[#1a1a1a]">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}