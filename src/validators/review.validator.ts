import { z } from 'zod';
import { MAX_RATING, MAX_TEXT_LENGTH, MIN_RATING, RATING_STEP } from '../models/Review';
import { objectIdSchema } from './common.validator';

export const createReviewSchema = z.object({
  rating: z.number().min(MIN_RATING).max(MAX_RATING).multipleOf(RATING_STEP),
  text: z.string().trim().min(1).max(MAX_TEXT_LENGTH),
});

export const updateReviewSchema = createReviewSchema
  .partial()
  .refine((body) => Object.keys(body).length > 0, 'At least one field is required');

export const listReviewsParamsSchema = z.object({ movieId: objectIdSchema });

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
