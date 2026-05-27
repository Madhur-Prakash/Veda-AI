import { Schema, model, type InferSchemaType } from 'mongoose';

const assignedPaperSchema = new Schema(
  {
    assignmentExternalId: { type: String, required: true },
    assignmentTitle: { type: String, required: true },
    assignedAt: { type: Date, default: Date.now },
    dueDate: { type: Date }
  },
  { _id: false }
);

const groupSchema = new Schema(
  {
    externalId: { type: String, required: true, unique: true, index: true },
    teacherId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    className: { type: String, required: true, trim: true },
    colorIdx: { type: Number, default: 0, min: 0, max: 7 },
    studentCount: { type: Number, default: 0, min: 0 },
    inviteCode: { type: String, required: true, unique: true, index: true },
    assignedPapers: { type: [assignedPaperSchema], default: [] }
  },
  { timestamps: true }
);

export type IGroup = InferSchemaType<typeof groupSchema> & { _id: unknown; externalId: string };
export const GroupModel = model('Group', groupSchema);
