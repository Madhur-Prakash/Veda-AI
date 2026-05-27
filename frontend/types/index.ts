export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type QuestionType = 'MCQ' | 'Short' | 'Long' | 'Case Study' | 'True False';
export type JobState = 'QUEUED' | 'PROCESSING' | 'FAILED' | 'COMPLETED' | 'REGENERATING';

export interface User {
  externalId: string;
  name: string;
  email: string;
  role: 'teacher' | 'admin';
  school: string;
  createdAt: string;
}

export interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

export interface QuestionControl {
  type: QuestionType;
  count: number;
  marks: number;
  difficultyDistribution: DifficultyDistribution;
}

export interface GenerationQuestion {
  id: string;
  question: string;
  difficulty: Difficulty;
  marks: number;
  type: QuestionType;
  answer_key: string;
  blooms_level: string;
  estimated_time: string;
}

export interface GenerationSection {
  title: string;
  instruction: string;
  questions: GenerationQuestion[];
}

export interface GeneratedAssessment {
  sections: GenerationSection[];
}

export interface Assignment {
  _id: string;
  externalId: string;
  teacherId: string;
  generationJobId?: string;
  title: string;
  subject: string;
  className: string;
  topic: string;
  dueDate: string;
  durationMinutes: number;
  totalMarks: number;
  inputSource: 'pdf' | 'txt' | 'paste';
  content: string;
  instructions: string;
  questionControls: QuestionControl[];
  status: JobState;
  generatedAssessment: GeneratedAssessment | null;
  pdfUrl: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentCreatePayload {
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
  language?: string;
  questionControls: QuestionControl[];
}

export interface AssignedPaper {
  assignmentExternalId: string;
  assignmentTitle: string;
  assignedAt: string;
  dueDate?: string;
}

export interface Group {
  _id: string;
  externalId: string;
  teacherId: string;
  name: string;
  subject: string;
  className: string;
  colorIdx: number;
  studentCount: number;
  inviteCode: string;
  assignedPapers: AssignedPaper[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  totalAssignments: number;
  completedAssignments: number;
  processingJobs: number;
  successRate: number;
}

export interface GenerationProgressEvent {
  assignmentExternalId: string;
  progress: number;
  message: string;
}
