"use client";

import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Bot, FileUp, GripVertical, Mic, Plus, Trash2, UploadCloud } from 'lucide-react';
import { Shell } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type QuestionType = {
  label: string;
  count: number;
  marks: number;
};

const initialQuestionTypes: QuestionType[] = [
  { label: 'Multiple Choice Questions', count: 4, marks: 1 },
  { label: 'Short Questions', count: 3, marks: 2 },
  { label: 'Diagram/Graph-Based Questions', count: 5, marks: 5 },
  { label: 'Numerical Problems', count: 5, marks: 5 }
];

export default function CreatePage() {
  const [questionTypes, setQuestionTypes] = useState(initialQuestionTypes);

  const totals = useMemo(
    () => ({
      questions: questionTypes.reduce((sum, item) => sum + item.count, 0),
      marks: questionTypes.reduce((sum, item) => sum + item.count * item.marks, 0)
    }),
    [questionTypes]
  );

  const updateType = (index: number, key: keyof QuestionType, delta: number) => {
    setQuestionTypes((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: Math.max(1, item[key] + delta) } : item)));
  };

  return (
    <Shell activePath="/toolkit" title="Create New" titleIcon={Bot}>
      <div className="mx-auto w-full max-w-[860px] px-1 pb-12 md:px-0">
        <div className="mb-6">
          <div className="flex items-center gap-3 text-[20px] font-semibold text-ink">
            <span className="h-3.5 w-3.5 rounded-full bg-[#41c36f] shadow-[0_0_0_8px_rgba(65,195,111,0.16)]" />
            <span>Create Assignment</span>
          </div>
          <p className="mt-1 text-[15px] text-neutral-400">Set up a new assignment for your students</p>
          <div className="mt-6 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-neutral-300/80" />
            <div className="h-1.5 flex-1 rounded-full bg-neutral-200" />
          </div>
        </div>

        <section className="rounded-[32px] bg-[#2d2d2d] p-6 text-white shadow-soft md:p-7">
          <p className="max-w-4xl text-[20px] font-semibold leading-8 md:text-[22px]">
            Certainly, Lakshya! Here are customized Question Paper for your CBSE Grade 8 Science classes on the NCERT chapters:
          </p>
          <div className="mt-6">
            <Button variant="outline" className="h-12 rounded-full border-none bg-white px-5 text-[16px] text-ink hover:bg-white/95">
              <FileUp className="h-5 w-5" />
              Download as PDF
            </Button>
          </div>
        </section>

        <section className="mt-4 rounded-[32px] bg-white px-6 py-6 shadow-soft md:px-8 md:py-7">
          <div className="rounded-[28px] border border-white/70 bg-[#fbfbfb] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
            <h2 className="font-display text-[28px] font-semibold text-center tracking-tight md:text-[34px]">Assignment Details</h2>
            <p className="mt-1 text-center text-[15px] text-neutral-400">Basic information about your assignment</p>

            <div className="mt-6 rounded-[24px] border-2 border-dashed border-[#d8d4d2] bg-white px-6 py-12 text-center">
              <UploadCloud className="mx-auto h-7 w-7 text-neutral-400" />
              <p className="mt-4 text-[15px] text-neutral-600">Choose a file or drag & drop it here</p>
              <p className="mt-1 text-[12px] text-neutral-400">JPEG, PNG, upto 10MB</p>
              <div className="mt-5 flex justify-center">
                <Button variant="outline" className="h-11 rounded-full px-6">Browse Files</Button>
              </div>
            </div>
            <p className="mt-3 text-center text-[13px] text-neutral-400">Upload images of your preferred document/image</p>

            <div className="mt-6 grid gap-5 md:grid-cols-[1fr_auto] md:items-start">
              <div>
                <label className="mb-2 block text-[14px] font-semibold text-ink">Due Date</label>
                <Input placeholder="DD-MM-YYYY" className="h-11 rounded-full bg-[#f8f8f8]" />
              </div>
              <div className="hidden md:block" />
            </div>

            <div className="mt-6 grid grid-cols-[1fr_120px_120px] gap-4">
              <div className="text-[14px] font-semibold text-ink">Question Type</div>
              <div className="text-center text-[14px] font-semibold text-ink">No. of Questions</div>
              <div className="text-center text-[14px] font-semibold text-ink">Marks</div>
            </div>

            <div className="mt-3 space-y-3">
              {questionTypes.map((item, index) => (
                <div key={item.label} className="grid grid-cols-[1fr_120px_120px] items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex min-w-0 flex-1 items-center justify-between rounded-full bg-[#f8f7f6] px-4 py-3">
                      <span className="truncate text-[14px] text-ink">{item.label}</span>
                      <span className="text-neutral-400">▾</span>
                    </div>
                    <button className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-neutral-500 hover:bg-black/[0.03]" aria-label={`Remove ${item.label}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <Stepper value={item.count} onDecrease={() => updateType(index, 'count', -1)} onIncrease={() => updateType(index, 'count', 1)} />
                  <Stepper value={item.marks} onDecrease={() => updateType(index, 'marks', -1)} onIncrease={() => updateType(index, 'marks', 1)} />
                </div>
              ))}
            </div>

            <button className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[14px] font-semibold text-white shadow-sm hover:bg-black">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-lg">+</span>
              Add Question Type
            </button>

            <div className="mt-6 flex items-end justify-between gap-4 text-[14px] md:text-[15px]">
              <div />
              <div className="space-y-1 text-right">
                <p><span className="font-semibold">Total Questions :</span> {totals.questions}</p>
                <p><span className="font-semibold">Total Marks :</span> {totals.marks}</p>
              </div>
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-[14px] font-semibold text-ink">Additional Information (For better output)</label>
              <div className="rounded-[22px] border-2 border-dashed border-[#ece7e5] bg-[#fbfbfb] p-4">
                <textarea className="min-h-[115px] w-full resize-none border-none bg-transparent text-[15px] text-ink outline-none placeholder:text-neutral-400" placeholder="e.g Generate a question paper for 3 hour exam duration..." />
                <div className="mt-2 flex justify-end text-neutral-500">
                  <Mic className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 flex items-center justify-between px-1">
          <Button variant="soft" className="h-11 px-5 text-[14px] font-semibold text-ink">
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button className="h-11 px-5 text-[14px] font-semibold">
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Shell>
  );
}

function Stepper({ value, onDecrease, onIncrease }: { value: number; onDecrease: () => void; onIncrease: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-full bg-[#f8f7f6] px-2 py-1.5">
      <button type="button" onClick={onDecrease} className="grid h-7 w-7 place-items-center rounded-full text-neutral-500 hover:bg-black/[0.05]">
        −
      </button>
      <span className="min-w-6 text-center text-[14px] font-semibold text-ink">{value}</span>
      <button type="button" onClick={onIncrease} className="grid h-7 w-7 place-items-center rounded-full text-neutral-500 hover:bg-black/[0.05]">
        +
      </button>
    </div>
  );
}