'use client';

import { useState } from 'react';
import { Shell } from '@/components/shell';
import { Library, BookOpen, Target, Brain, BarChart3, FileText, ChevronRight, Zap, Wrench, Copy, Check } from 'lucide-react';
import { toolkitApi } from '@/lib/api';

const TOOLS = [
  {
    id: 'rubric',
    icon: FileText,
    color: 'bg-violet-50 text-violet-600',
    badge: 'Popular',
    badgeColor: 'bg-violet-100 text-violet-700',
    title: 'Rubric Generator',
    description: 'Instantly create detailed grading rubrics for any assignment or project. Specify criteria, weight, and performance levels.',
    tags: ['Grading', 'Rubric', 'Criteria'],
    inputLabel: 'Describe the assignment and rubric requirements',
    placeholder: 'e.g. Create a rubric for a Grade 9 Science lab report on photosynthesis. Include 4 criteria: Scientific Process, Data Analysis, Conclusion, and Presentation. Use 4 performance levels.'
  },
  {
    id: 'blooms',
    icon: Brain,
    color: 'bg-blue-50 text-blue-600',
    badge: 'New',
    badgeColor: 'bg-blue-100 text-blue-700',
    title: "Bloom's Analyzer",
    description: "Analyze your question paper against Bloom's Taxonomy levels. Get a cognitive distribution report and suggestions to improve depth.",
    tags: ["Bloom's", 'Cognitive', 'Analysis'],
    inputLabel: 'Paste your questions (one per line)',
    placeholder: '1. Define electric current and state its SI unit.\n2. Explain how resistance affects current flow.\n3. Design a circuit that reduces power consumption by 30%.\n4. Compare series and parallel circuits with examples.'
  },
  {
    id: 'lessonplan',
    icon: BookOpen,
    color: 'bg-emerald-50 text-emerald-600',
    badge: null,
    badgeColor: '',
    title: 'Lesson Plan Creator',
    description: 'Generate structured lesson plans aligned to NCERT or state board syllabus. Set objectives, activities, and assessments in seconds.',
    tags: ['Lesson Plan', 'NCERT', 'Syllabus'],
    inputLabel: 'Describe the lesson details',
    placeholder: 'e.g. Class 8 Science, Chapter: Force and Pressure. Duration: 45 minutes. Board: CBSE/NCERT. Students have prior knowledge of motion. Focus on conceptual understanding with real-world examples.'
  },
  {
    id: 'difficulty',
    icon: Target,
    color: 'bg-amber-50 text-amber-600',
    badge: 'Beta',
    badgeColor: 'bg-amber-100 text-amber-700',
    title: 'Difficulty Calibrator',
    description: 'Paste any question and let AI score its difficulty on a 1–10 scale with reasoning. Calibrate your paper before distributing.',
    tags: ['Difficulty', 'Scoring', 'Calibration'],
    inputLabel: 'Paste the question to analyse',
    placeholder: 'e.g. "A train 100m long is moving at 72 km/h. A man is running at 18 km/h in the opposite direction. How long does it take for the train to completely pass the man? Show all working."'
  },
  {
    id: 'rewriter',
    icon: BarChart3,
    color: 'bg-rose-50 text-rose-600',
    badge: 'Beta',
    badgeColor: 'bg-amber-100 text-amber-700',
    title: 'Question Rewriter',
    description: 'Rephrase an existing question to a different difficulty, language, or question type (MCQ → Short, Short → Long) in one click.',
    tags: ['Rephrase', 'Question', 'Rewrite'],
    inputLabel: 'Paste the question and describe the change',
    placeholder: 'Original question: "What is photosynthesis?"\n\nInstruction: Rewrite as a higher-order thinking MCQ (Bloom\'s: Analyse level) for Grade 10 students. Provide 4 options.'
  },
  {
    id: 'summarizer',
    icon: Zap,
    color: 'bg-orange-50 text-orange-600',
    badge: null,
    badgeColor: '',
    title: 'Chapter Summarizer',
    description: 'Upload a chapter or paste text and receive a concise, student-friendly summary with key points, definitions, and formulas.',
    tags: ['Summary', 'Notes', 'Key Points'],
    inputLabel: 'Paste the chapter text or describe the topic',
    placeholder: 'e.g. Summarise Chapter 12: Electricity (NCERT Class 10 Science). Cover: electric current, potential difference, resistance, Ohm\'s law, series and parallel circuits, heating effect of current, and power.'
  }
];

function MarkdownResult({ text }: { text: string }) {
  const lines = text.split('\n');

  function parseBold(str: string): React.ReactNode[] {
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={i} className="font-semibold text-[#1f1f1f]">{p.slice(2, -2)}</strong>
        : p
    );
  }

  const elements: React.ReactNode[] = [];
  const listBuffer: React.ReactNode[] = [];

  function flushList() {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-1 ml-5 space-y-0.5 list-disc text-[14px] text-neutral-700">
          {[...listBuffer]}
        </ul>
      );
      listBuffer.length = 0;
    }
  }

  lines.forEach((line, i) => {
    if (line.startsWith('### ')) {
      flushList();
      elements.push(<h3 key={i} className="mt-4 mb-1 text-[15px] font-bold text-[#1f1f1f]">{line.slice(4)}</h3>);
    } else if (line.startsWith('## ')) {
      flushList();
      elements.push(<h2 key={i} className="mt-5 mb-1.5 text-[17px] font-bold text-[#1f1f1f] border-b border-neutral-100 pb-1">{line.slice(3)}</h2>);
    } else if (line.startsWith('# ')) {
      flushList();
      elements.push(<h1 key={i} className="mt-6 mb-2 text-[19px] font-bold text-[#1f1f1f]">{line.slice(2)}</h1>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      listBuffer.push(<li key={i}>{parseBold(line.slice(2))}</li>);
    } else if (/^\d+\.\s/.test(line)) {
      listBuffer.push(<li key={i} className="list-decimal">{parseBold(line.replace(/^\d+\.\s/, ''))}</li>);
    } else if (line.startsWith('| ') && !line.includes('---')) {
      flushList();
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      const isHeader = i < lines.length - 1 && lines[i + 1]?.startsWith('|') && lines[i + 1].includes('---');
      elements.push(
        <div key={i} className={`flex gap-0 border-b border-neutral-100 py-1.5 text-[13px] ${isHeader ? 'font-semibold bg-neutral-50' : ''}`}>
          {cells.map((cell, ci) => (
            <span key={ci} className="flex-1 px-2">{parseBold(cell)}</span>
          ))}
        </div>
      );
    } else if (line.includes('---') && line.startsWith('|')) {
      // table separator – skip
    } else if (line.trim() === '') {
      flushList();
      elements.push(<div key={i} className="h-2" />);
    } else {
      flushList();
      elements.push(<p key={i} className="text-[14px] leading-7 text-neutral-700">{parseBold(line)}</p>);
    }
  });

  flushList();
  return <div className="space-y-0.5">{elements}</div>;
}

export default function ToolkitPage() {
  const [active, setActive] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  function openTool(id: string) {
    setActive(id);
    setInput('');
    setResult('');
    setError('');
  }

  async function handleGenerate() {
    if (!input.trim() || !active) return;
    setLoading(true);
    setResult('');
    setError('');
    try {
      const { data } = await toolkitApi.run(active, input.trim());
      setResult(data.data.result as string);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setError(e.response?.data?.error?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            A suite of AI-powered tools built for educators. Generate rubrics, analyse question depth, create lesson plans, and more — all in seconds.
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
                {activeTool.inputLabel}
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={6}
                placeholder={activeTool.placeholder}
                className="w-full rounded-[20px] border border-neutral-200 bg-[#fafafa] px-5 py-4 text-[14px] text-[#1f1f1f] outline-none transition focus:border-[#ff6a2b] focus:ring-2 focus:ring-[#ff6a2b]/20 placeholder:text-neutral-400 resize-none"
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

            {error && (
              <div className="mt-4 rounded-[16px] border border-red-200 bg-red-50 px-5 py-3 text-[13px] text-red-600">
                {error}
              </div>
            )}

            {result && (
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-neutral-500">Result</span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-[12px] font-medium text-neutral-500 hover:border-[#ff6a2b] hover:text-[#ff6a2b] transition"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="rounded-[20px] border border-neutral-100 bg-[#fafafa] px-6 py-5">
                  <MarkdownResult text={result} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Shell>
  );
}
