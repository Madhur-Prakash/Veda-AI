import { Schema, model, type InferSchemaType } from 'mongoose';
import type { JobState } from '@/types.js';

const difficultySchema = new Schema(
  {
    easy: { type: Number, required: true, min: 0 },
    medium: { type: Number, required: true, min: 0 },
    hard: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const questionControlSchema = new Schema(
  {
    type: { type: String, required: true, enum: ['MCQ', 'Short', 'Long', 'Case Study', 'True False'] },
    count: { type: Number, required: true, min: 1 },
    marks: { type: Number, required: true, min: 1 },
    difficultyDistribution: { type: difficultySchema, required: true }
  },
  { _id: false }
);

const assignmentSchema = new Schema(
  {
    externalId: { type: String, required: true, unique: true, index: true },
    teacherId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    className: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    totalMarks: { type: Number, required: true, min: 1 },
    inputSource: { type: String, required: true, enum: ['pdf', 'txt', 'paste'] },
    content: { type: String, default: '' },
    instructions: { type: String, default: '' },
    learningOutcomes: { type: [String], default: [] },
    bloomTaxonomy: { type: [String], default: [] },
    language: { type: String, default: 'English' },
    strictMode: { type: Boolean, default: false },
    questionControls: { type: [questionControlSchema], required: true },
    status: { type: String, required: true, default: 'QUEUED' },
    generationJobId: { type: String, default: '' },
    generatedAssessment: { type: Schema.Types.Mixed, default: null },
    pdfUrl: { type: String, default: '' },
    version: { type: Number, default: 1 }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export type AssignmentDocument = InferSchemaType<typeof assignmentSchema> & {
  _id: Schema.Types.ObjectId;
  status: JobState;
};

export const AssignmentModel = model('Assignment', assignmentSchema);