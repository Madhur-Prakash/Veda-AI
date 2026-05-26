import { Schema, model, type InferSchemaType } from 'mongoose';

const jobSchema = new Schema(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    assignmentExternalId: { type: String, required: true, index: true },
    state: { type: String, required: true },
    progress: { type: Number, required: true, default: 0, min: 0, max: 100 },
    message: { type: String, default: '' }
  },
  { timestamps: true, versionKey: false }
);

export type JobDocument = InferSchemaType<typeof jobSchema>;

export const GenerationJobModel = model('GenerationJob', jobSchema);