export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type QuestionType = 'MCQ' | 'Short' | 'Long' | 'Case Study' | 'True False';

export type JobState = 'QUEUED' | 'PROCESSING' | 'FAILED' | 'COMPLETED' | 'REGENERATING';

export type GenerationQuestion = {
  id: string;
  question: string;
  difficulty: Difficulty;
  marks: number;
  type: QuestionType;
  answer_key: string;
  blooms_level: string;
  estimated_time: string;
};

export type GenerationSection = {
  title: string;
  instruction: string;
  questions: GenerationQuestion[];
};

export type GeneratedAssessment = {
  sections: GenerationSection[];
};

export type AssignmentCreateInput = {
  teacherId: string;
  title: string;
  subject: string;
  className: string;
  topic: string;
  dueDate: string;
  durationMinutes: number;
  totalMarks: number;
  inputSource: 'pdf' | 'txt' | 'paste';
  content?: string;
  instructions?: string;
  learningOutcomes?: string[];
  bloomTaxonomy?: string[];
  language?: string;
  strictMode?: boolean;
  questionControls: Array<{
    type: QuestionType;
    count: number;
    marks: number;
    difficultyDistribution: { easy: number; medium: number; hard: number };
  }>;
};