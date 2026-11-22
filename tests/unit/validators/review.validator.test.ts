import {
  createReviewSchema,
  listReviewsParamsSchema,
  updateReviewSchema,
} from '../../../src/validators/review.validator';
import { reviewInput } from '../../helpers/reviews';

describe('createReviewSchema', () => {
  it.each([1, 8.5, 10])('accepts rating %s', (rating) => {
    expect(createReviewSchema.safeParse(reviewInput({ rating })).success).toBe(true);
  });

  it.each([8.3, 11, 0.5, 0, '8'])('rejects rating %s', (rating) => {
    expect(createReviewSchema.safeParse(reviewInput({ rating })).success).toBe(false);
  });

  it.each([
    ['empty text', ''],
    ['blank text', '   '],
    ['text over 2000 chars', 'a'.repeat(2001)],
  ])('rejects %s', (_case, text) => {
    expect(createReviewSchema.safeParse(reviewInput({ text })).success).toBe(false);
  });

  it('accepts 2000 chars of text', () => {
    expect(createReviewSchema.safeParse(reviewInput({ text: 'a'.repeat(2000) })).success).toBe(
      true,
    );
  });

  it('strips movie and user from the body', () => {
    const result = createReviewSchema.parse(reviewInput({ movie: 'x', user: 'y' }));

    expect(result).toEqual(reviewInput());
  });
});

describe('updateReviewSchema', () => {
  it('only keeps rating and text', () => {
    expect(updateReviewSchema.parse({ rating: 9, movie: 'x', user: 'y' })).toEqual({ rating: 9 });
  });

  it('rejects an empty update', () => {
    expect(updateReviewSchema.safeParse({}).success).toBe(false);
  });

  it('rejects an invalid rating', () => {
    expect(updateReviewSchema.safeParse({ rating: 8.3 }).success).toBe(false);
  });
});

describe('listReviewsParamsSchema', () => {
  it('rejects an invalid movie id', () => {
    expect(listReviewsParamsSchema.safeParse({ movieId: 'nope' }).success).toBe(false);
  });
});
