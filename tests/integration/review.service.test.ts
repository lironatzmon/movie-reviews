import { Types } from 'mongoose';
import { Movie } from '../../src/models/Movie';
import { Review } from '../../src/models/Review';
import * as movieService from '../../src/services/movie.service';
import * as reviewService from '../../src/services/review.service';
import { AppError } from '../../src/utils/AppError';
import * as db from '../helpers/db';
import { createUser, TestUser } from '../helpers/auth';
import { movieInput } from '../helpers/movies';
import { reviewInput } from '../helpers/reviews';

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

let author: TestUser;
const missingId = new Types.ObjectId().toString();
let movieId: string;

beforeEach(async () => {
  author = await createUser();
  movieId = (await movieService.createMovie(movieInput(), (await createUser()).id)).id;
});

async function expectAppError(promise: Promise<unknown>, statusCode: number) {
  await expect(promise).rejects.toBeInstanceOf(AppError);
  await expect(promise).rejects.toMatchObject({ statusCode });
}

const review = async (rating: number, user?: TestUser) =>
  reviewService.createReview(movieId, reviewInput({ rating }), (user ?? (await createUser())).id);

const movieRating = async () => {
  const { averageRating, reviewsCount } = (await Movie.findById(movieId))!;
  return { averageRating, reviewsCount };
};

describe('createReview', () => {
  it('stores the review for the user and updates the movie rating', async () => {
    const created = await review(8, author);

    expect(created.user.toString()).toBe(author.id);
    expect(created.movie.toString()).toBe(movieId);
    expect(await movieRating()).toEqual({ averageRating: 8, reviewsCount: 1 });
  });

  it('averages several reviews rounded to 1 decimal', async () => {
    await review(8);
    await review(8.5);
    await review(10);

    expect(await movieRating()).toEqual({ averageRating: 8.8, reviewsCount: 3 });
  });

  it('throws 409 for a second review by the same user', async () => {
    await review(8, author);

    await expectAppError(review(9, author), 409);
    expect(await movieRating()).toEqual({ averageRating: 8, reviewsCount: 1 });
  });

  it('throws 404 when the movie does not exist', async () => {
    await expectAppError(reviewService.createReview(missingId, reviewInput(), author.id), 404);
  });
});

describe('updateReview', () => {
  it('lets the owner update and recalculates the rating', async () => {
    const created = await review(8, author);
    await review(6);

    const updated = await reviewService.updateReview(created.id, { rating: 10 }, author);

    expect(updated.rating).toBe(10);
    expect(await movieRating()).toEqual({ averageRating: 8, reviewsCount: 2 });
  });

  it('lets an admin update', async () => {
    const created = await review(8, author);

    const updated = await reviewService.updateReview(
      created.id,
      { text: 'Edited' },
      await createUser('admin'),
    );

    expect(updated.text).toBe('Edited');
  });

  it('throws 403 for another user', async () => {
    const created = await review(8, author);

    await expectAppError(
      reviewService.updateReview(created.id, { rating: 1 }, await createUser()),
      403,
    );
  });

  it('throws 404 for a missing review', async () => {
    await expectAppError(reviewService.updateReview(missingId, { rating: 1 }, author), 404);
  });
});

describe('deleteReview', () => {
  it('lets the owner delete and recalculates the rating', async () => {
    const created = await review(10, author);
    await review(6);

    await reviewService.deleteReview(created.id, author);

    expect(await Review.findById(created.id)).toBeNull();
    expect(await movieRating()).toEqual({ averageRating: 6, reviewsCount: 1 });
  });

  it('resets the rating to 0 when the last review is deleted', async () => {
    const created = await review(9, author);

    await reviewService.deleteReview(created.id, author);

    expect(await movieRating()).toEqual({ averageRating: 0, reviewsCount: 0 });
  });

  it('lets an admin delete', async () => {
    const created = await review(9, author);

    await reviewService.deleteReview(created.id, await createUser('admin'));

    expect(await Review.findById(created.id)).toBeNull();
  });

  it('throws 403 for another user', async () => {
    const created = await review(9, author);

    await expectAppError(reviewService.deleteReview(created.id, await createUser()), 403);
  });
});

describe('listReviews', () => {
  it('returns reviews newest first with pagination', async () => {
    await review(5);
    const second = await review(6);
    const third = await review(7);

    const result = await reviewService.listReviews(movieId, { page: 1, limit: 2 });

    expect(result.data.map((r) => r.id)).toEqual([third.id, second.id]);
    expect(result.pagination).toEqual({ page: 1, limit: 2, total: 3 });
  });

  it('throws 404 when the movie does not exist', async () => {
    await expectAppError(reviewService.listReviews(missingId, { page: 1, limit: 10 }), 404);
  });
});

describe('getMovieRating', () => {
  it('returns 0 and 0 for a movie without reviews', async () => {
    expect(await reviewService.getMovieRating(movieId)).toEqual({
      averageRating: 0,
      reviewsCount: 0,
    });
  });

  it('returns the stored rating', async () => {
    await review(7);
    await review(8);

    expect(await reviewService.getMovieRating(movieId)).toEqual({
      averageRating: 7.5,
      reviewsCount: 2,
    });
  });
});

describe('recalculateMovieRating', () => {
  it('recomputes from the stored reviews', async () => {
    await review(4);
    await Movie.updateOne({ _id: movieId }, { averageRating: 99, reviewsCount: 99 });

    await reviewService.recalculateMovieRating(movieId);

    expect(await movieRating()).toEqual({ averageRating: 4, reviewsCount: 1 });
  });
});

describe('deleteMovie', () => {
  it('removes the movie reviews', async () => {
    const owner = await createUser();
    const movie = await movieService.createMovie(movieInput(), owner.id);
    await reviewService.createReview(movie.id, reviewInput(), author.id);
    await review(8);

    await movieService.deleteMovie(movie.id, owner);

    expect(await Review.countDocuments({ movie: movie.id })).toBe(0);
    expect(await Review.countDocuments({ movie: movieId })).toBe(1);
  });
});

describe('deleteReviewsByUser', () => {
  it("deletes the user's reviews and recalculates every affected movie", async () => {
    const otherMovieId = (await movieService.createMovie(movieInput(), author.id)).id;
    await review(10, author);
    await review(6);
    await reviewService.createReview(otherMovieId, reviewInput({ rating: 9 }), author.id);

    await reviewService.deleteReviewsByUser(author.id);

    expect(await Review.countDocuments({ user: author.id })).toBe(0);
    expect(await movieRating()).toEqual({ averageRating: 6, reviewsCount: 1 });
    expect(await reviewService.getMovieRating(otherMovieId)).toEqual({
      averageRating: 0,
      reviewsCount: 0,
    });
  });

  it('does nothing for a user without reviews', async () => {
    await review(7);

    await reviewService.deleteReviewsByUser(author.id);

    expect(await movieRating()).toEqual({ averageRating: 7, reviewsCount: 1 });
  });
});
