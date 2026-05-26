import { Schema, model, type InferSchemaType } from 'mongoose';

const draftSchema = new Schema(
  {
    teacherId: { type: String, required: true, index: true },
    assignmentExternalId: { type: String, required: true, index: true },
    payload: { type: Schema.Types.Mixed, required: true }
  },
  { timestamps: true, versionKey: false }
);

export type DraftDocument = InferSchemaType<typeof draftSchema>;

export const AssignmentDraftModel = model('AssignmentDraft', draftSchema);