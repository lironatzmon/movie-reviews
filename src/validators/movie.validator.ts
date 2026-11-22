import { z } from 'zod';
import { MIN_RELEASE_YEAR, maxReleaseYear } from '../models/Movie';
import { paginationQuerySchema } from './common.validator';

const releaseYearSchema = z.coerce
  .number()
  .int()
  .min(MIN_RELEASE_YEAR)
  .refine((year) => year <= maxReleaseYear(), 'releaseYear is too far in the future');

const nonEmptyString = z.string().trim().min(1);

export const createMovieSchema = z.object({
  title: nonEmptyString,
  releaseYear: releaseYearSchema,
  genres: z.array(nonEmptyString).min(1),
  director: nonEmptyString,
  actors: z.array(nonEmptyString).optional(),
  description: z.string().trim().optional(),
});

export const updateMovieSchema = createMovieSchema
  .partial()
  .refine((body) => Object.keys(body).length > 0, 'At least one field is required');

export const MOVIE_SORTS = ['rating', '-rating', 'year', '-year', 'title'] as const;

export const listMoviesQuerySchema = paginationQuerySchema.extend({
  search: nonEmptyString.optional(),
  genre: nonEmptyString.optional(),
  year: releaseYearSchema.optional(),
  director: nonEmptyString.optional(),
  sort: z.enum(MOVIE_SORTS).optional(),
});

export type CreateMovieInput = z.infer<typeof createMovieSchema>;
export type UpdateMovieInput = z.infer<typeof updateMovieSchema>;
export type ListMoviesQuery = z.infer<typeof listMoviesQuerySchema>;
