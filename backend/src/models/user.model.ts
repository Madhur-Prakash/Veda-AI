import { Schema, model, type InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    externalId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['teacher', 'admin'], default: 'teacher' },
    school: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    refreshToken: { type: String, default: '' }
  },
  { timestamps: true, versionKey: false }
);

export type UserDocument = InferSchemaType<typeof userSchema> & { _id: Schema.Types.ObjectId };

export const UserModel = model('User', userSchema);
