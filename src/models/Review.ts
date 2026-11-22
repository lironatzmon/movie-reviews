import { InferSchemaType, Schema, model } from 'mongoose';
import { toJSONOptions } from './toJSON';

export const MIN_RATING = 1;
export const MAX_RATING = 10;
export const RATING_STEP = 0.5;
export const MAX_TEXT_LENGTH = 2000;

const reviewSchema = new Schema(
  {
    movie: { type: Schema.Types.ObjectId, ref: 'Movie', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: {
      type: Number,
      required: true,
      min: MIN_RATING,
      max: MAX_RATING,
      validate: {
        validator: (rating: number) => Number.isInteger(rating / RATING_STEP),
        message: `rating must be a multiple of ${RATING_STEP}`,
      },
    },
    text: { type: String, required: true, trim: true, minlength: 1, maxlength: MAX_TEXT_LENGTH },
  },
  { timestamps: true, toJSON: toJSONOptions },
);

reviewSchema.index({ movie: 1, user: 1 }, { unique: true });

export type ReviewDoc = InferSchemaType<typeof reviewSchema>;

export const Review = model('Review', reviewSchema);
