'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Download, FileText, ClipboardList } from 'lucide-react';
import { Shell } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { useAssignmentStore } from '@/store/assignmentStore';

export default function OutputPage() {
  return <Suspense><OutputPageInner /></Suspense>;
}

function OutputPageInner() {
  const searchParams = useSearchParams();
  const assignmentId = searchParams?.get('id') ?? '';
  const { currentAssignment, fetchAssignment, isLoading } = useAssignmentStore();
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (assignmentId) {
      fetchAssignment(assignmentId);
    }
  }, [assignmentId, fetchAssignment]);

  const assignment = currentAssignment?.externalId === assignmentId ? currentAssignment : null;
  const assessment = assignment?.generatedAssessment ?? null;
  const isWaiting = Boolean(assignmentId) && (!assignment || isLoading || !assessment);

  const currentAssessment = assessment!;

  function handleDownload() {
    if (!assignmentId) return;

    const token = localStorage.getItem('accessToken');
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || '/api/v1';
    const url = `${baseUrl}/assignments/${assignmentId}/export/pdf`;

    setIsDownloading(true);
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `assessment-${assignmentId}.pdf`;
        link.click();
      })
      .finally(() => setIsDownloading(false));
  }

  return (
    <Shell activePath="/toolkit" title="Generated Paper" titleIcon={ClipboardList}>
      <div className="mx-auto w-full max-w-[1100px] px-1 pb-10 md:px-0">
        <section className="rounded-[34px] bg-[#282828] p-7 text-white shadow-soft md:p-8">
          <p className="max-w-5xl text-[18px] font-semibold leading-8 md:text-[22px]">
            {assignment
              ? `Here is your generated question paper for ${assignment.subject}, Class ${assignment.className}.`
              : assignmentId
                ? 'Fetching the generated paper from the backend so the preview stays in sync with the assessment record.'
                : 'Open this preview with an assignment ID to see the backend-generated question paper.'}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {assignmentId && (
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={isDownloading || isWaiting}
                className="h-12 rounded-full border-none bg-white px-5 text-[16px] text-ink hover:bg-white/95"
              >
                <FileText className="h-5 w-5" />
                {isDownloading ? 'Downloading…' : 'Download as PDF'}
                <Download className="h-5 w-5" />
              </Button>
            )}
            {!assignmentId && (
              <Link href="/create-assignment" className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-5 text-[16px] font-semibold text-ink hover:bg-white/95">
                Create Assignment
              </Link>
            )}
          </div>
        </section>

        {isWaiting ? (
          <section className="paper-shadow mt-4 rounded-[34px] bg-white px-8 py-10 md:px-16 md:py-12">
            <div className="space-y-4">
              <div className="h-10 w-3/5 animate-pulse rounded-full bg-neutral-100" />
              <div className="mx-auto h-6 w-1/3 animate-pulse rounded-full bg-neutral-100" />
              <div className="mx-auto h-6 w-1/4 animate-pulse rounded-full bg-neutral-100" />
            </div>

            <div className="mt-10 rounded-[28px] border border-dashed border-neutral-200 bg-[#fafafa] px-6 py-8 text-center">
              <p className="text-[15px] font-semibold text-neutral-700">AI output for {assignmentId || 'this assignment'} will appear here once the backend endpoint is connected.</p>
              <p className="mt-2 text-[14px] text-neutral-500">
                {isLoading
                  ? 'Loading the latest assessment state from the backend...'
                  : 'Waiting for the generated assessment payload.'}
              </p>
            </div>

            <div className="mt-12 grid gap-4 rounded-[28px] bg-[#fafafa] p-5 md:grid-cols-3">
              <Metric label="Sections" value="..." />
              <Metric label="Questions" value="..." />
              <Metric label="Marks" value="..." />
            </div>

            <div className="mt-6 text-center">
              <Link href={assignmentId ? `/assessment/${assignmentId}` : '/create-assignment'} className="text-[14px] font-semibold text-[#ff6a2b] hover:underline">
                Open assessment view
              </Link>
            </div>
          </section>
        ) : assignment ? (
          <section className="paper-shadow mt-4 rounded-[34px] bg-white px-8 py-9 md:px-16 md:py-12">
            <div className="text-center">
              <h1 className="font-display text-[28px] font-semibold tracking-tight md:text-[40px]">
                {assignment.schoolName ?? 'Delhi Public School, Sector-4, Bokaro'}
              </h1>
              <p className="mt-1 text-[14px] italic text-neutral-500 md:text-[16px]">Question Paper</p>
              <h1 className="font-display text-[28px] font-semibold tracking-tight md:text-[40px]">
                {assignment.title}
              </h1>
              <p className="mt-1 text-[18px] font-semibold md:text-[28px]">Subject: {assignment.subject}</p>
              <p className="mt-1 text-[18px] font-semibold md:text-[28px]">Class: {assignment.className}</p>
            </div>

            <div className="mt-8 flex items-start justify-between text-[15px] md:text-[18px]">
              <span><strong>Time Allowed:</strong> {assignment.durationMinutes} minutes</span>
              <span><strong>Maximum Marks:</strong> {assignment.totalMarks}</span>
            </div>

            <p className="mt-6 text-[15px] font-medium md:text-[18px]">All questions are compulsory unless stated otherwise.</p>

            <div className="mt-8 space-y-1 text-[15px] md:text-[18px]">
              <p><strong>Name:</strong> __________________</p>
              <p><strong>Roll Number:</strong> ______________</p>
              <p><strong>Class:</strong> {assignment.className} Section: ________</p>
            </div>

            <div className="mt-10 text-center">
              <h2 className="font-display text-[28px] font-semibold md:text-[36px]">Question Paper</h2>
            </div>

            {currentAssessment.sections.map((section, sectionIndex) => (
              <div key={section.title || sectionIndex} className="mt-10">
                <h3 className="text-[18px] font-semibold md:text-[24px]">{section.title}</h3>
                {section.instruction && (
                  <p className="mt-1 text-[14px] italic text-neutral-600 md:text-[18px]">{section.instruction}</p>
                )}

                <ol className="mt-8 space-y-5 text-[15px] leading-7 text-neutral-700 md:text-[18px] md:leading-8">
                  {section.questions.map((question, questionIndex) => (
                    <li key={question.id || `${sectionIndex}-${questionIndex}`}>
                      {questionIndex + 1}. [{question.difficulty}] {question.question} [{question.marks} Marks]
                    </li>
                  ))}
                </ol>
              </div>
            ))}

            <div className="mt-12 border-t border-neutral-200 pt-10">
              <h3 className="text-[22px] font-semibold md:text-[28px]">Answer Key:</h3>
              <ol className="mt-5 space-y-5 text-[15px] leading-7 text-neutral-700 md:text-[18px] md:leading-8">
                {currentAssessment.sections.flatMap((section) => section.questions).map((question, index) => (
                  <li key={question.id ?? `${question.question}-${index}`}>
                    <span className="font-semibold">{index + 1}.</span> {question.answer_key}
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-12 grid gap-4 rounded-[28px] bg-[#fafafa] p-5 md:grid-cols-3">
              <Metric label="Sections" value={String(currentAssessment.sections.length)} />
              <Metric label="Questions" value={String(currentAssessment.sections.reduce((sum, section) => sum + section.questions.length, 0))} />
              <Metric label="Marks" value={String(assignment.totalMarks)} />
            </div>
          </section>
        ) : (
          <section className="paper-shadow mt-4 rounded-[34px] bg-white px-8 py-10 text-center md:px-16 md:py-12">
            <p className="text-[18px] font-semibold text-neutral-700">No generated assessment found.</p>
            <p className="mt-2 text-[15px] text-neutral-500">Create or regenerate an assignment, then open this page with its ID.</p>
            <Link href="/create-assignment" className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-black">
              Create Assignment
            </Link>
          </section>
        )}
      </div>
    </Shell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-white px-5 py-4 text-center shadow-sm">
      <div className="text-sm uppercase tracking-[0.2em] text-neutral-400">{label}</div>
      <div className="mt-2 font-display text-3xl font-semibold text-ink">{value}</div>
    </div>
  );
}
