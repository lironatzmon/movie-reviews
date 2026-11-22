import { InferSchemaType, Schema, model } from 'mongoose';
import { toJSONOptions } from './toJSON';

export const MIN_RELEASE_YEAR = 1888;
export const maxReleaseYear = () => new Date().getFullYear() + 5;

const movieSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    releaseYear: {
      type: Number,
      required: true,
      min: MIN_RELEASE_YEAR,
      validate: {
        validator: (year: number) => year <= maxReleaseYear(),
        message: 'releaseYear is too far in the future',
      },
    },
    genres: {
      type: [String],
      validate: {
        validator: (genres: string[]) => genres.length > 0,
        message: 'At least one genre is required',
      },
    },
    director: { type: String, required: true, trim: true },
    actors: { type: [String], default: [] },
    description: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    averageRating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: toJSONOptions },
);

export type MovieDoc = InferSchemaType<typeof movieSchema>;

export const Movie = model('Movie', movieSchema);
