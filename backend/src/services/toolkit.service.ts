import Groq from 'groq-sdk';
import { env } from '@/config.js';
import { HttpError } from '@/utils/httpError.js';

export type ToolId = 'rubric' | 'blooms' | 'lessonplan' | 'difficulty' | 'rewriter' | 'summarizer';

const SYSTEM_PROMPTS: Record<ToolId, string> = {
  rubric:
    'You are an expert educational assessment designer. Generate a detailed grading rubric in markdown. Use a table with columns: Criteria | Weight (%) | Excellent (4) | Good (3) | Developing (2) | Beginning (1). Include 4-6 criteria. Be specific and actionable for teachers. Add a brief scoring guide at the end.',
  blooms:
    'You are an expert in Bloom\'s Taxonomy for education. Analyse the provided questions, identify each question\'s Bloom\'s level (Remember, Understand, Apply, Analyse, Evaluate, Create), produce a distribution summary table, then give 3 concrete suggestions to improve the cognitive depth of the question set. Use markdown with clear headings.',
  lessonplan:
    'You are a curriculum designer familiar with NCERT and state-board syllabi. Generate a structured lesson plan in markdown with these sections: ## Learning Objectives, ## Prerequisites, ## Materials Needed, ## Introduction (5 min), ## Main Activity (20-25 min), ## Assessment Activity (10 min), ## Homework / Extension, ## Key Vocabulary.',
  difficulty:
    'You are an educational assessment expert. Analyse the provided question and score its difficulty from 1-10 (1 = very easy, 10 = very hard). Break down your reasoning across: Cognitive complexity, Prerequisite knowledge required, Language / vocabulary level, Typical student performance. Present as structured markdown with a prominent score at the top.',
  rewriter:
    'You are a question-design specialist. Rewrite the given question according to the teacher\'s instructions. Maintain the core learning objective. Output: the rewritten question, a brief explanation of what changed, and why the change improves the question. Use markdown.',
  summarizer:
    'You are an educational content specialist. Create a concise, student-friendly summary in markdown with these sections: ## Quick Summary (2-3 sentences), ## Key Concepts (bullet list), ## Important Definitions (term: definition format), ## Key Formulas (if applicable), ## Exam Tips (3 bullets).',
};

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

export class ToolkitService {
  async run(toolId: ToolId, userPrompt: string): Promise<string> {
    const system = SYSTEM_PROMPTS[toolId];
    if (!system) throw new HttpError(400, `Unknown tool: ${toolId}`);

    try {
      const completion = await groq.chat.completions.create({
        model: env.GROQ_MODEL,
        temperature: 0.4,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt },
        ],
      });

      const text = completion.choices[0]?.message?.content;
      if (!text) throw new HttpError(502, 'AI did not return any content');
      return text;
    } catch (err) {
      const e = err as { status?: number; code?: string; message?: string };
      if (
        e.status === 429 ||
        e.code === 'rate_limit_exceeded' ||
        /rate limit/i.test(e.message ?? '')
      ) {
        throw new HttpError(429, 'Groq rate limit reached. Please try again shortly.');
      }
      throw err;
    }
  }
}

export const toolkitService = new ToolkitService();
