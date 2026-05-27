import type { AssignmentCreateInput } from '@/types.js';

export function buildPrompt(input: AssignmentCreateInput) {
  const system = [
    'You are a deterministic exam paper generator.',
    'Return valid JSON only.',
    'Strictly adhere to the output schema provided in the user message.',
    'Match the requested schema exactly.',
    'Never include markdown, commentary, or code fences.',
    'Avoid duplicates and balance question difficulty and marks.',
    'Name sections strictly as Section A, Section B, Section C, and so on. Do not use alternative labels like Part, Unit, or Chapter.'
  ].join(' ');

  const user = {
    assignment: input,
    outputSchema: {
      sections: [
        {
          title: 'string',
          instruction: 'string',
          questions: [
            {
              id: 'string',
              question: 'string',
              difficulty: 'Easy | Medium | Hard',
              marks: 1,
              type: 'MCQ | Short | Long | Case Study | True False',
              answer_key: 'string',
              blooms_level: 'string',
              estimated_time: 'string'
            }
          ]
        }
      ]
    }
  };

  return { system, user };
}