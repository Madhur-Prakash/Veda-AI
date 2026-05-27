'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Mic, Plus, Trash2, UploadCloud, X } from 'lucide-react';
import { Shell } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useGenerationStore } from '@/store/generationStore';
import type { QuestionControl, QuestionType } from '@/types';

const QUESTION_TYPE_OPTIONS: QuestionType[] = ['MCQ', 'Short', 'Long', 'Case Study', 'True False'];

const DEFAULT_CONTROLS: QuestionControl[] = [
  { type: 'MCQ', count: 5, marks: 1, difficultyDistribution: { easy: 40, medium: 40, hard: 20 } },
  { type: 'Short', count: 4, marks: 3, difficultyDistribution: { easy: 30, medium: 50, hard: 20 } }
];

const TEMPLATE_PRESETS: Record<string, { totalMarks: number; durationMinutes: number; controls: QuestionControl[] }> = {
  unit_test: {
    totalMarks: 30, durationMinutes: 45,
    controls: [
      { type: 'MCQ',   count: 10, marks: 1, difficultyDistribution: { easy: 40, medium: 40, hard: 20 } },
      { type: 'Short', count: 5,  marks: 2, difficultyDistribution: { easy: 30, medium: 50, hard: 20 } },
      { type: 'Long',  count: 2,  marks: 5, difficultyDistribution: { easy: 20, medium: 50, hard: 30 } }
    ]
  },
  half_yearly: {
    totalMarks: 80, durationMinutes: 120,
    controls: [
      { type: 'MCQ',        count: 20, marks: 1, difficultyDistribution: { easy: 40, medium: 40, hard: 20 } },
      { type: 'Short',      count: 10, marks: 2, difficultyDistribution: { easy: 30, medium: 50, hard: 20 } },
      { type: 'Long',       count: 5,  marks: 6, difficultyDistribution: { easy: 20, medium: 50, hard: 30 } },
      { type: 'Case Study', count: 2,  marks: 5, difficultyDistribution: { easy: 10, medium: 60, hard: 30 } }
    ]
  },
  quick_quiz: {
    totalMarks: 20, durationMinutes: 30,
    controls: [
      { type: 'MCQ',   count: 5, marks: 1, difficultyDistribution: { easy: 50, medium: 40, hard: 10 } },
      { type: 'Short', count: 5, marks: 3, difficultyDistribution: { easy: 40, medium: 50, hard: 10 } }
    ]
  },
  practical: {
    totalMarks: 25, durationMinutes: 60,
    controls: [
      { type: 'Short', count: 5, marks: 3, difficultyDistribution: { easy: 30, medium: 50, hard: 20 } },
      { type: 'Long',  count: 2, marks: 5, difficultyDistribution: { easy: 20, medium: 50, hard: 30 } }
    ]
  }
};

function DifficultySliders({ dist, onChange }: { dist: QuestionControl['difficultyDistribution']; onChange: (d: QuestionControl['difficultyDistribution']) => void }) {
  const total = dist.easy + dist.medium + dist.hard;
  const isValid = total === 100;

  function update(key: keyof typeof dist, val: number) {
    const next = { ...dist, [key]: Math.max(0, Math.min(100, val)) };
    onChange(next);
  }

  return (
    <div className="mt-3 space-y-2">
      {(['easy', 'medium', 'hard'] as const).map((level) => {
        const colors = { easy: 'bg-green-500', medium: 'bg-yellow-500', hard: 'bg-red-500' };
        const textColors = { easy: 'text-green-600', medium: 'text-yellow-600', hard: 'text-red-600' };
        return (
          <div key={level} className="flex items-center gap-3">
            <span className={`w-14 text-[12px] font-semibold capitalize ${textColors[level]}`}>{level}</span>
            <div className="relative flex-1 h-2 rounded-full bg-neutral-200">
              <div className={`absolute left-0 top-0 h-2 rounded-full ${colors[level]} transition-all`} style={{ width: `${dist[level]}%` }} />
            </div>
            <input
              type="number"
              min={0}
              max={100}
              value={dist[level]}
              onChange={(e) => update(level, Number(e.target.value))}
              className="w-14 rounded-full border border-neutral-200 bg-[#f8f8f8] px-2 py-1 text-center text-[13px] font-semibold outline-none focus:border-[#ff6a2b]"
            />
            <span className="text-[12px] text-neutral-400">%</span>
          </div>
        );
      })}
      {!isValid && <p className="text-[12px] text-red-500">Total must equal 100% (currently {total}%)</p>}
    </div>
  );
}

function Stepper({ value, onDecrease, onIncrease }: { value: number; onDecrease: () => void; onIncrease: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-full bg-[#f8f7f6] px-2 py-1.5">
      <button type="button" onClick={onDecrease} className="grid h-7 w-7 place-items-center rounded-full text-neutral-500 hover:bg-black/[0.05]">−</button>
      <span className="min-w-6 text-center text-[14px] font-semibold">{value}</span>
      <button type="button" onClick={onIncrease} className="grid h-7 w-7 place-items-center rounded-full text-neutral-500 hover:bg-black/[0.05]">+</button>
    </div>
  );
}

export default function CreateAssignmentPage() {
  const router = useRouter();
  const { createAssignment, error } = useAssignmentStore();
  const { setQueued } = useGenerationStore();

  const [form, setForm] = useState({
    schoolName: 'Delhi Public School, Sector-4, Bokaro',
    subject: '',
    className: '',
    topic: '',
    dueDate: '',
    durationMinutes: 60,
    totalMarks: 50,
    instructions: '',
    language: 'English'
  });
  const [controls, setControls] = useState<QuestionControl[]>(DEFAULT_CONTROLS);
  const [dragOver, setDragOver] = useState(false);

  // Seed defaults from Settings preferences once the component mounts on the client
  useEffect(() => {
    const lang = localStorage.getItem('vedaai_default_language');
    const dur = localStorage.getItem('vedaai_default_duration');
    setForm((f) => ({
      ...f,
      ...(lang ? { language: lang } : {}),
      ...(dur && !isNaN(Number(dur)) ? { durationMinutes: Number(dur) } : {})
    }));

    // Apply template preset from ?template= URL param (set by Library → Use Template)
    const params = new URLSearchParams(window.location.search);
    const templateId = params.get('template');
    if (templateId && TEMPLATE_PRESETS[templateId]) {
      const preset = TEMPLATE_PRESETS[templateId];
      setForm((f) => ({ ...f, totalMarks: preset.totalMarks, durationMinutes: preset.durationMinutes }));
      setControls(preset.controls);
    }
  }, []);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedControl, setExpandedControl] = useState<number | null>(null);

  const totals = {
    questions: controls.reduce((s, c) => s + c.count, 0),
    marks: controls.reduce((s, c) => s + c.count * c.marks, 0)
  };

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.schoolName.trim()) e.schoolName = 'School name is required';
    if (!form.subject.trim()) e.subject = 'Subject is required';
    if (!form.className.trim()) e.className = 'Class is required';
    if (!form.topic.trim()) e.topic = 'Topic is required';
    if (!form.dueDate) e.dueDate = 'Due date is required';
    else if (new Date(form.dueDate) <= new Date()) e.dueDate = 'Due date must be in the future';
    controls.forEach((c, i) => {
      const total = c.difficultyDistribution.easy + c.difficultyDistribution.medium + c.difficultyDistribution.hard;
      if (total !== 100) e[`diff_${i}`] = `Question type ${i + 1}: difficulty must total 100%`;
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'application/pdf' || file.name.endsWith('.txt'))) {
      setUploadedFile(file);
    }
  }, []);

  function addControl() {
    const usedTypes = controls.map((c) => c.type);
    const available = QUESTION_TYPE_OPTIONS.find((t) => !usedTypes.includes(t)) ?? 'MCQ';
    setControls((prev) => [...prev, { type: available, count: 3, marks: 2, difficultyDistribution: { easy: 30, medium: 50, hard: 20 } }]);
  }

  function removeControl(i: number) {
    setControls((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateControl(i: number, key: keyof QuestionControl, value: unknown) {
    setControls((prev) => prev.map((c, idx) => idx === i ? { ...c, [key]: value } : c));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const dueDate = new Date(form.dueDate).toISOString();
      const title = `${form.subject.trim()} - ${form.topic.trim()}`;
      const payload = {
        title,
        schoolName: form.schoolName,
        subject: form.subject,
        className: form.className,
        topic: form.topic,
        dueDate,
        durationMinutes: form.durationMinutes,
        totalMarks: form.totalMarks,
        inputSource: uploadedFile ? (uploadedFile.name.endsWith('.pdf') ? 'pdf' : 'txt') as 'pdf' | 'txt' : 'paste' as const,
        content: form.topic,
        instructions: form.instructions,
        language: form.language,
        questionControls: controls
      };
      const assignment = await createAssignment(payload);
      setQueued(assignment.externalId, `generation:${assignment.externalId}:${assignment.generationJobId ?? assignment.version}`);
      router.push(`/generation-status?id=${assignment.externalId}`);
    } catch {
      setIsSubmitting(false);
    }
  }

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  return (
    <Shell title="Create Assignment" titleIcon={Bot}>
      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[860px] px-1 pb-12 md:px-0">
        <div className="mb-6">
          <div className="flex items-center gap-3 text-[20px] font-semibold">
            <span className="h-3.5 w-3.5 rounded-full bg-[#41c36f] shadow-[0_0_0_8px_rgba(65,195,111,0.16)]" />
            Create Assignment
          </div>
          <p className="mt-1 text-[15px] text-neutral-400">Configure your AI-generated assessment</p>
          <div className="mt-6 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-[#ff6a2b]" />
            <div className="h-1.5 flex-1 rounded-full bg-neutral-200" />
          </div>
        </div>

        <section className="rounded-[32px] bg-white px-6 py-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)] md:px-8 md:py-7">
          <div className="rounded-[28px] border border-white/70 bg-[#fbfbfb] px-5 py-5">
            <h2 className="font-display text-[28px] font-semibold text-center tracking-tight md:text-[32px]">Assignment Details</h2>
            <p className="mt-1 text-center text-[15px] text-neutral-400">Provide details about the assignment</p>

            {/* File Upload */}
            <div className="mt-6">
              <label className="mb-2 block text-[14px] font-semibold">Upload Reference Material (optional)</label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`rounded-[24px] border-2 border-dashed bg-white px-6 py-10 text-center transition ${dragOver ? 'border-[#ff6a2b] bg-[#fff8f5]' : 'border-[#d8d4d2]'}`}
              >
                {uploadedFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-[14px] font-medium text-green-700">
                      <span>✓</span> {uploadedFile.name}
                    </div>
                    <button type="button" onClick={() => setUploadedFile(null)} className="text-[13px] text-neutral-400 hover:text-red-500">
                      <X className="inline h-3 w-3" /> Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="mx-auto h-7 w-7 text-neutral-400" />
                    <p className="mt-3 text-[15px] text-neutral-600">Drag & drop a PDF or TXT file here</p>
                    <p className="mt-1 text-[12px] text-neutral-400">Max 10MB</p>
                    <label className="mt-4 inline-flex cursor-pointer items-center rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-[14px] font-medium text-neutral-700 hover:bg-neutral-50">
                      Browse Files
                      <input type="file" accept=".pdf,.txt" className="sr-only" onChange={(e) => setUploadedFile(e.target.files?.[0] ?? null)} />
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Basic Info Grid */}
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                { key: 'schoolName', label: 'School Name', placeholder: 'e.g. Delhi Public School, Sector-4, Bokaro' },
                { key: 'subject', label: 'Subject', placeholder: 'e.g. Science' },
                { key: 'className', label: 'Class / Grade', placeholder: 'e.g. Grade 8' },
                { key: 'topic', label: 'Topic / Chapter', placeholder: 'e.g. Force and Motion' }
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="mb-1.5 block text-[13px] font-semibold">{label}</label>
                  <input
                    type="text"
                    value={(form as Record<string, unknown>)[key] as string}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className={`h-11 w-full rounded-full border bg-[#f8f8f8] px-4 text-[14px] outline-none transition focus:border-[#ff6a2b] focus:ring-2 focus:ring-[#ff6a2b]/20 placeholder:text-neutral-400 ${errors[key] ? 'border-red-400' : 'border-[#e5e5e5]'}`}
                  />
                  {errors[key] && <p className="mt-1 text-[12px] text-red-500">{errors[key]}</p>}
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold">Due Date</label>
                <input
                  type="date"
                  min={minDateStr}
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className={`h-11 w-full rounded-full border bg-[#f8f8f8] px-4 text-[14px] outline-none transition focus:border-[#ff6a2b] focus:ring-2 focus:ring-[#ff6a2b]/20 ${errors.dueDate ? 'border-red-400' : 'border-[#e5e5e5]'}`}
                />
                {errors.dueDate && <p className="mt-1 text-[12px] text-red-500">{errors.dueDate}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold">Duration (minutes)</label>
                <input
                  type="number"
                  min={5}
                  max={600}
                  value={form.durationMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))}
                  className="h-11 w-full rounded-full border border-[#e5e5e5] bg-[#f8f8f8] px-4 text-[14px] outline-none transition focus:border-[#ff6a2b] focus:ring-2 focus:ring-[#ff6a2b]/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold">Total Marks</label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={form.totalMarks}
                  onChange={(e) => setForm((f) => ({ ...f, totalMarks: Number(e.target.value) }))}
                  className="h-11 w-full rounded-full border border-[#e5e5e5] bg-[#f8f8f8] px-4 text-[14px] outline-none transition focus:border-[#ff6a2b] focus:ring-2 focus:ring-[#ff6a2b]/20"
                />
              </div>
            </div>

            {/* Question Type Configuration */}
            <div className="mt-8">
              {/* Desktop header row */}
              <div className="mb-3 hidden grid-cols-[1fr_100px_100px_44px] gap-3 px-1 text-[13px] font-semibold text-neutral-500 md:grid">
                <span>Question Type</span>
                <span className="text-center">Questions</span>
                <span className="text-center">Marks each</span>
                <span />
              </div>

              <div className="space-y-3">
                {controls.map((ctrl, i) => (
                  <div key={i}>
                    {/* Mobile card layout */}
                    <div className="rounded-[18px] border border-neutral-100 bg-[#f8f8f8] p-3 md:hidden">
                      <div className="flex items-center gap-2">
                        <select
                          value={ctrl.type}
                          onChange={(e) => updateControl(i, 'type', e.target.value as QuestionType)}
                          className="h-10 flex-1 rounded-full border border-[#e5e5e5] bg-white px-4 text-[14px] outline-none focus:border-[#ff6a2b]"
                        >
                          {QUESTION_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button type="button" onClick={() => removeControl(i)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-neutral-200 text-neutral-500 hover:bg-red-50 hover:text-red-500" aria-label="Remove">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div>
                          <p className="mb-1.5 text-[11px] font-semibold text-neutral-400">Questions</p>
                          <Stepper value={ctrl.count} onDecrease={() => updateControl(i, 'count', Math.max(1, ctrl.count - 1))} onIncrease={() => updateControl(i, 'count', ctrl.count + 1)} />
                        </div>
                        <div>
                          <p className="mb-1.5 text-[11px] font-semibold text-neutral-400">Marks each</p>
                          <Stepper value={ctrl.marks} onDecrease={() => updateControl(i, 'marks', Math.max(1, ctrl.marks - 1))} onIncrease={() => updateControl(i, 'marks', ctrl.marks + 1)} />
                        </div>
                      </div>
                      <button type="button" onClick={() => setExpandedControl(expandedControl === i ? null : i)} className="mt-2 text-[12px] font-medium text-[#ff6a2b]">
                        {expandedControl === i ? '▲ Hide difficulty' : '% Set difficulty'}
                      </button>
                    </div>

                    {/* Desktop row layout */}
                    <div className="hidden md:grid md:grid-cols-[1fr_100px_100px_44px] md:items-center md:gap-3">
                      <select
                        value={ctrl.type}
                        onChange={(e) => updateControl(i, 'type', e.target.value as QuestionType)}
                        className="h-11 rounded-full border border-[#e5e5e5] bg-[#f8f7f6] px-4 text-[14px] outline-none focus:border-[#ff6a2b]"
                      >
                        {QUESTION_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <Stepper
                        value={ctrl.count}
                        onDecrease={() => updateControl(i, 'count', Math.max(1, ctrl.count - 1))}
                        onIncrease={() => updateControl(i, 'count', ctrl.count + 1)}
                      />
                      <Stepper
                        value={ctrl.marks}
                        onDecrease={() => updateControl(i, 'marks', Math.max(1, ctrl.marks - 1))}
                        onIncrease={() => updateControl(i, 'marks', ctrl.marks + 1)}
                      />
                      <div className="flex gap-1">
                        <button type="button" onClick={() => setExpandedControl(expandedControl === i ? null : i)} className="grid h-9 w-9 place-items-center rounded-full border border-neutral-200 text-[10px] text-neutral-500 hover:bg-black/[0.03]" title="Difficulty">
                          %
                        </button>
                        <button type="button" onClick={() => removeControl(i)} className="grid h-9 w-9 place-items-center rounded-full border border-neutral-200 text-neutral-500 hover:bg-red-50 hover:text-red-500" aria-label="Remove">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {expandedControl === i && (
                      <div className="ml-2 mt-2 rounded-[18px] border border-neutral-100 bg-white p-4">
                        <p className="mb-1 text-[12px] font-semibold text-neutral-500">Difficulty Distribution</p>
                        <DifficultySliders
                          dist={ctrl.difficultyDistribution}
                          onChange={(d) => updateControl(i, 'difficultyDistribution', d)}
                        />
                        {errors[`diff_${i}`] && <p className="mt-2 text-[12px] text-red-500">{errors[`diff_${i}`]}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button type="button" onClick={addControl} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1f1f1f] px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-black">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10">
                  <Plus className="h-3.5 w-3.5" />
                </span>
                Add Question Type
              </button>

              <div className="mt-5 flex items-center justify-end gap-8 text-[14px] border-t border-neutral-100 pt-4">
                <p><span className="font-semibold">Total Questions:</span> <span className="text-[#ff6a2b] font-bold">{totals.questions}</span></p>
                <p><span className="font-semibold">Total Marks:</span> <span className="text-[#ff6a2b] font-bold">{totals.marks}</span></p>
              </div>
            </div>

            {/* Additional Instructions */}
            <div className="mt-6">
              <label className="mb-2 block text-[14px] font-semibold">Additional Instructions</label>
              <div className="rounded-[22px] border-2 border-dashed border-[#ece7e5] bg-[#fbfbfb] p-4">
                <textarea
                  value={form.instructions}
                  onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
                  className="min-h-[100px] w-full resize-none border-none bg-transparent text-[15px] outline-none placeholder:text-neutral-400"
                  placeholder="e.g. Focus on conceptual understanding. Avoid repetitive questions. Include real-world examples."
                />
                <div className="mt-2 flex justify-end text-neutral-400">
                  <Mic className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 flex flex-col-reverse items-stretch gap-3 px-1 sm:flex-row sm:items-center sm:justify-end">
          {error && (
            <div className="max-w-[540px] rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700" role="alert" aria-live="polite">
              {error}
            </div>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full px-8 text-[15px] font-semibold disabled:opacity-60 sm:w-auto"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Generating...
              </span>
            ) : (
              'Generate Assessment'
            )}
          </Button>
        </div>
      </form>
    </Shell>
  );
}
