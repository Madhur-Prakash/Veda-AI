import { Schema, model, type InferSchemaType } from 'mongoose';

const versionSchema = new Schema(
  {
    assignmentExternalId: { type: String, required: true, index: true },
    version: { type: Number, required: true },
    generatedAssessment: { type: Schema.Types.Mixed, required: true },
    notes: { type: String, default: '' }
  },
  { timestamps: true, versionKey: false }
);

export type VersionDocument = InferSchemaType<typeof versionSchema>;

export const AssignmentVersionModel = model('AssignmentVersion', versionSchema);