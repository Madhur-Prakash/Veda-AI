import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  school: z.string().max(120).optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const difficultySchema = z.object({
  easy: z.number().int().min(0),
  medium: z.number().int().min(0),
  hard: z.number().int().min(0)
});

const questionControlSchema = z.object({
  type: z.enum(['MCQ', 'Short', 'Long', 'Case Study', 'True False']),
  count: z.number().int().min(1).max(100),
  marks: z.number().int().min(1).max(100),
  difficultyDistribution: difficultySchema
});

export const createAssignmentSchema = z.object({
  title: z.string().min(3).max(120),
  subject: z.string().min(2).max(80),
  className: z.string().min(1).max(40),
  topic: z.string().min(2).max(160),
  dueDate: z.string().datetime({ offset: true }),
  durationMinutes: z.number().int().min(5).max(600),
  totalMarks: z.number().int().min(1).max(1000),
  inputSource: z.enum(['pdf', 'txt', 'paste']),
  content: z.string().optional(),
  instructions: z.string().optional(),
  learningOutcomes: z.array(z.string().min(1)).optional(),
  bloomTaxonomy: z.array(z.string().min(1)).optional(),
  language: z.string().optional(),
  strictMode: z.boolean().optional(),
  questionControls: z.array(questionControlSchema).min(1)
});

export const regenerateAssignmentSchema = z.object({
  notes: z.string().optional()
});