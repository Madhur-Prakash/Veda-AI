import Groq from 'groq-sdk';
import { env } from '@/config.js';
import type { GeneratedAssessment } from '@/types.js';
import { tryParseJson } from '@/services/jsonRepair.js';
import { HttpError } from '@/utils/httpError.js';

export interface AiProvider {
  generateAssessment(prompt: { system: string; user: unknown }): Promise<GeneratedAssessment>;
}

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

function isGroqRateLimitError(error: unknown) {
  const candidate = error as {
    status?: number;
    code?: string;
    message?: string;
    response?: { status?: number };
  } | null;

  return candidate?.status === 429 || candidate?.response?.status === 429 || candidate?.code === 'rate_limit_exceeded' || /rate limit|too many requests/i.test(candidate?.message ?? '');
}

export class GroqAiProvider implements AiProvider {
  async generateAssessment(prompt: { system: string; user: unknown }): Promise<GeneratedAssessment> {
    let completion;

    try {
      completion = await groq.chat.completions.create({
        model: env.GROQ_MODEL,
        temperature: 0.2,
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: JSON.stringify(prompt.user) }
        ],
        response_format: { type: 'json_object' }
      });
    } catch (error) {
      if (isGroqRateLimitError(error)) {
        throw new HttpError(429, 'Groq rate limit reached.');
      }

      throw error;
    }

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      throw new HttpError(502, 'Groq did not return an assessment payload');
    }

    const parsed = tryParseJson(raw) as GeneratedAssessment;
    if (!parsed?.sections || !Array.isArray(parsed.sections)) {
      throw new HttpError(502, 'Groq response did not match the expected assessment schema');
    }

    return parsed;
  }
}