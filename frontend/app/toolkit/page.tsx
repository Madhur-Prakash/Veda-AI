'use client';

import { useState } from 'react';
import { Shell } from '@/components/shell';
import { Library, BookOpen, Target, Brain, BarChart3, FileText, ChevronRight, Zap, Wrench } from 'lucide-react';

const TOOLS = [
  {
    id: 'rubric',
    icon: FileText,
    color: 'bg-violet-50 text-violet-600',
    badge: 'Popular',
    badgeColor: 'bg-violet-100 text-violet-700',
    title: 'Rubric Generator',
    description: 'Instantly create detailed grading rubrics for any assignment or project. Specify criteria, weight, and performance levels.',
    tags: ['Grading', 'Rubric', 'Criteria']
  },
  {
    id: 'blooms',
    icon: Brain,
    color: 'bg-blue-50 text-blue-600',
    badge: 'New',
    badgeColor: 'bg-blue-100 text-blue-700',
    title: "Bloom's Analyzer",
    description: "Analyze your question paper against Bloom's Taxonomy levels. Get a cognitive distribution report and suggestions to improve depth.",
    tags: ["Bloom's", 'Cognitive', 'Analysis']
  },
  {
    id: 'lessonplan',
    icon: BookOpen,
    color: 'bg-emerald-50 text-emerald-600',
    badge: null,
    badgeColor: '',
    title: 'Lesson Plan Creator',
    description: 'Generate structured lesson plans aligned to NCERT or state board syllabus. Set objectives, activities, and assessments in seconds.',
    tags: ['Lesson Plan', 'NCERT', 'Syllabus']
  },
  {
    id: 'difficulty',
    icon: Target,
    color: 'bg-amber-50 text-amber-600',
    badge: 'Beta',
    badgeColor: 'bg-amber-100 text-amber-700',
    title: 'Difficulty Calibrator',
    description: 'Paste any question and let AI score its difficulty on a 1–10 scale with reasoning. Calibrate your paper before distributing.',
    tags: ['Difficulty', 'Scoring', 'Calibration']
  },
  {
    id: 'performance',
    icon: BarChart3,
    color: 'bg-rose-50 text-rose-600',
    badge: 'Beta',
    badgeColor: 'bg-amber-100 text-amber-700',
    title: 'Question Rewriter',
    description: 'Rephrase an existing question to a different difficulty, language, or question type (MCQ → Short, Short → Long) in one click.',
    tags: ['Rephrase', 'Question', 'Rewrite']
  },
  {
    id: 'outline',
    icon: Zap,
    color: 'bg-orange-50 text-orange-600',
    badge: null,
    badgeColor: '',
    title: 'Chapter Summarizer',
    description: 'Upload a chapter or paste text and receive a concise, student-friendly summary with key points, definitions, and formulas.',
    tags: ['Summary', 'Notes', 'Key Points']
  }
];

export default function ToolkitPage() {
  const [active, setActive] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  function openTool(id: string) {
    setActive(id);
    setInput('');
    setResult('');
  }

  function handleGenerate() {
    if (!input.trim()) return;
    setLoading(true);
    setResult('');
    setTimeout(() => {
      setResult(`AI output for "${input.slice(0, 60)}…" will appear here once the backend endpoint is connected. This UI is ready to wire up.`);
      setLoading(false);
    }, 1200);
  }

  const activeTool = TOOLS.find((t) => t.id === active);

  return (
    <Shell title="AI Teacher's Toolkit" titleIcon={Library}>
      <div className="mx-auto max-w-[1100px] pb-10">
        {/* Header */}
        <div className="mb-6 rounded-[34px] bg-[linear-gradient(135deg,#1f1f1f_0%,#3a1c13_100%)] px-8 py-7 text-white">
          <div className="flex items-center gap-3">
            <Wrench className="h-6 w-6 text-[#ffb24f]" />
            <h1 className="text-[24px] font-bold">AI Teacher&apos;s Toolkit</h1>
          </div>
          <p className="mt-2 max-w-2xl text-[15px] text-neutral-300 leading-7">
            A suite of AI-powered tools built for educators. Generate rubrics, analyze question depth, create lesson plans, and more — all in seconds.
          </p>
          <div className="mt-4 flex gap-3 text-[13px]">
            <span className="rounded-full bg-white/10 px-3 py-1">{TOOLS.length} tools available</span>
            <span className="rounded-full bg-[#ff6a2b]/30 px-3 py-1 text-[#ffb24f]">2 new this month</span>
          </div>
        </div>

        {/* Tool grid */}
        {!active && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                onClick={() => openTool(tool.id)}
                className="group rounded-[28px] bg-white p-6 text-left shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between">
                  <div className={`grid h-12 w-12 place-items-center rounded-[14px] ${tool.color}`}>
                    <tool.icon className="h-6 w-6" />
                  </div>
                  {tool.badge && (
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tool.badgeColor}`}>{tool.badge}</span>
                  )}
                </div>
                <h3 className="mt-4 text-[17px] font-semibold text-[#1f1f1f]">{tool.title}</h3>
                <p className="mt-1.5 text-[13px] leading-6 text-neutral-500">{tool.description}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {tool.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] text-neutral-500">{tag}</span>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-1 text-[13px] font-semibold text-[#ff6a2b] opacity-0 transition group-hover:opacity-100">
                  Open tool <ChevronRight className="h-4 w-4" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Active tool panel */}
        {active && activeTool && (
          <div className="rounded-[34px] bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
            <button onClick={() => setActive(null)} className="mb-6 text-[13px] font-medium text-neutral-400 hover:text-[#1f1f1f]">
              ← Back to all tools
            </button>
            <div className="flex items-center gap-4">
              <div className={`grid h-14 w-14 place-items-center rounded-[18px] ${activeTool.color}`}>
                <activeTool.icon className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-[22px] font-bold text-[#1f1f1f]">{activeTool.title}</h2>
                <p className="text-[14px] text-neutral-500">{activeTool.description}</p>
              </div>
            </div>

            <div className="mt-8">
              <label className="mb-2 block text-[14px] font-semibold text-[#1f1f1f]">
                Describe what you need
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={5}
                placeholder={`e.g. "Create a rubric for a Grade 9 Science lab report on photosynthesis with 4 criteria and 4 performance levels…"`}
                className="w-full rounded-[20px] border border-neutral-200 bg-[#fafafa] px-5 py-4 text-[15px] text-[#1f1f1f] outline-none transition focus:border-[#ff6a2b] focus:ring-2 focus:ring-[#ff6a2b]/20 placeholder:text-neutral-400 resize-none"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !input.trim()}
              className="mt-4 flex items-center gap-2 rounded-full bg-[#1f1f1f] px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-black disabled:opacity-50"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Wrench className="h-4 w-4" />
              )}
              {loading ? 'Generating…' : 'Generate with AI'}
            </button>

            {result && (
              <div className="mt-6 rounded-[20px] border border-neutral-100 bg-[#fafafa] px-6 py-5 text-[15px] leading-7 text-neutral-700">
                {result}
              </div>
            )}
          </div>
        )}
      </div>
    </Shell>
  );
}
