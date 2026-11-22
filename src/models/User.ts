import { HydratedDocument, InferSchemaType, Schema, model } from 'mongoose';
import { ROLES } from '../types/auth';
import { toJSONOptions } from './toJSON';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'user' },
  },
  { timestamps: true, toJSON: toJSONOptions },
);

export type UserAttrs = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<UserAttrs>;

export const User = model('User', userSchema);
