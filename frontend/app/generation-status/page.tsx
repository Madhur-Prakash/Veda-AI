'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Bot, CheckCircle, XCircle, RefreshCw, FileText } from 'lucide-react';
import { Shell } from '@/components/shell';
import { useGenerationStore } from '@/store/generationStore';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useSocket } from '@/hooks/useSocket';

const STEPS = [
  { label: 'Assignment queued', threshold: 0 },
  { label: 'Building AI prompt', threshold: 20 },
  { label: 'Generating questions', threshold: 40 },
  { label: 'Validating output', threshold: 70 },
  { label: 'Saving assessment', threshold: 90 },
  { label: 'Complete', threshold: 100 }
];

function GenerationStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignmentId = searchParams?.get('id') ?? '';
  const [isRetrying, setIsRetrying] = useState(false);

  const { status, progress, message, completedAssignment, error, setQueued, assignmentId: trackingId } = useGenerationStore();
  const { regenerate } = useAssignmentStore();

  useSocket(assignmentId);

  useEffect(() => {
    if (!assignmentId) return;
    // Reset and re-queue if the store is tracking a different assignment or is idle
      if (status === 'idle' || trackingId !== assignmentId) {
      setQueued(assignmentId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  useEffect(() => {
    // Guard: only redirect when the completed assignment matches the current URL's id
    if (status === 'completed' && completedAssignment && completedAssignment.externalId === assignmentId) {
      const timer = setTimeout(() => {
        router.push(`/assessment/${completedAssignment.externalId}`);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [status, completedAssignment, router, assignmentId]);

  async function handleRetry() {
    if (!assignmentId || isRetrying) return;

    setIsRetrying(true);
    try {
      await regenerate(assignmentId);
      setQueued(assignmentId, `generation:${assignmentId}:retry`);
    } finally {
      setIsRetrying(false);
    }
  }

  const activeStep = STEPS.filter((s) => progress >= s.threshold).length - 1;

  if (!assignmentId) {
    return (
      <Shell title="Generation Status" titleIcon={Bot}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <p className="text-neutral-500">No assignment ID found.</p>
            <Link href="/create-assignment" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1f1f1f] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-black">
              Create Assignment
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell title="Generation Status" titleIcon={Bot}>
      <div className="mx-auto w-full max-w-[640px] px-1 pb-12 md:px-0">
        <div className="mb-6">
          <div className="flex items-center gap-3 text-[20px] font-semibold">
            <span className="h-3.5 w-3.5 rounded-full bg-[#41c36f] shadow-[0_0_0_8px_rgba(65,195,111,0.16)]" />
            AI is generating your assessment
          </div>
          <p className="mt-1 text-[15px] text-neutral-400">ID: {assignmentId}</p>
        </div>

        <section className="rounded-[32px] bg-white px-6 py-8 shadow-[0_2px_12px_rgba(0,0,0,0.06)] md:px-8">
          {status === 'failed' ? (
            <div className="flex flex-col items-center gap-5 py-6 text-center">
              <XCircle className="h-16 w-16 text-red-500" />
              <div>
                <h2 className="text-[22px] font-semibold text-[#1f1f1f]">Generation Failed</h2>
                <p className="mt-2 text-[15px] text-neutral-500">{error ?? 'An unexpected error occurred.'}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="flex items-center gap-2 rounded-full border border-neutral-300 px-5 py-2.5 text-[14px] font-semibold text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
                  {isRetrying ? 'Retrying…' : 'Try Again'}
                </button>
              </div>
            </div>
          ) : status === 'completed' ? (
            <div className="flex flex-col items-center gap-5 py-6 text-center">
              <div className="relative">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20" />
              </div>
              <div>
                <h2 className="text-[22px] font-semibold text-[#1f1f1f]">Assessment Ready!</h2>
                <p className="mt-2 text-[15px] text-neutral-500">Redirecting you to the assessment…</p>
              </div>
              {completedAssignment && (
                <Link
                  href={`/assessment/${completedAssignment.externalId}`}
                  className="flex items-center gap-2 rounded-full bg-[#1f1f1f] px-6 py-3 text-[15px] font-semibold text-white hover:bg-black"
                >
                  <FileText className="h-4 w-4" /> View Assessment
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Progress bar */}
              <div className="relative mb-6">
                <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-3 rounded-full bg-[linear-gradient(90deg,#ff6a2b,#ffb24f)] transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[13px]">
                  <span className="text-neutral-500">{message || 'Waiting to start…'}</span>
                  <span className="font-bold text-[#ff6a2b]">{progress}%</span>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                {STEPS.map((step, i) => {
                  const done = i < activeStep;
                  const active = i === activeStep;
                  return (
                    <div key={step.label} className={`flex items-center gap-3 rounded-[18px] px-4 py-3 transition ${active ? 'bg-[#fff8f5]' : ''}`}>
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold transition ${done ? 'bg-green-500 text-white' : active ? 'bg-[#ff6a2b] text-white' : 'bg-neutral-100 text-neutral-400'}`}>
                        {done ? '✓' : active ? (
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : i + 1}
                      </div>
                      <span className={`text-[14px] ${active ? 'font-semibold text-[#1f1f1f]' : done ? 'text-neutral-500 line-through' : 'text-neutral-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* AI indicator */}
              <div className="mt-8 flex items-center justify-center gap-3 rounded-[20px] bg-[#f8f7f6] px-5 py-4">
                <div className="flex gap-1">
                  {[0, 0.15, 0.3].map((d) => (
                    <span key={d} className="h-2.5 w-2.5 rounded-full bg-[#ff6a2b] animate-bounce" style={{ animationDelay: `${d}s` }} />
                  ))}
                </div>
                <span className="text-[14px] text-neutral-600 font-medium">AI is crafting your questions…</span>
              </div>
            </>
          )}
        </section>
      </div>
    </Shell>
  );
}

export default function GenerationStatusPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-neutral-500">Loading…</div>}>
      <GenerationStatusContent />
    </Suspense>
  );
}
