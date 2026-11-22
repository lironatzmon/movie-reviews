import { ToObjectOptions } from 'mongoose';

/** Shared JSON shape for all models: `id` instead of `_id`, no `__v`, never a password. */
export const toJSONOptions: ToObjectOptions = {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret._id;
    delete ret.password;
    return ret;
  },
};
