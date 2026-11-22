import { Types } from 'mongoose';
import { Movie } from '../models/Movie';
import { Review } from '../models/Review';
import { AuthUser } from '../types/auth';
import { AppError } from '../utils/AppError';
import { assertOwnerOrAdmin } from '../utils/ownership';
import { CreateReviewInput, UpdateReviewInput } from '../validators/review.validator';
import { getMovie } from './movie.service';

interface Pagination {
  page: number;
  limit: number;
}

const roundToOneDecimal = (value: number) => Math.round(value * 10) / 10;

export async function recalculateMovieRating(movieId: string | Types.ObjectId): Promise<void> {
  const [stats] = await Review.aggregate<{ average: number; count: number }>([
    { $match: { movie: new Types.ObjectId(movieId) } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Movie.updateOne(
    { _id: movieId },
    {
      averageRating: stats ? roundToOneDecimal(stats.average) : 0,
      reviewsCount: stats?.count ?? 0,
    },
  );
}

export async function listReviews(movieId: string, { page, limit }: Pagination) {
  await getMovie(movieId);
  const filter = { movie: movieId };
  const [data, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Review.countDocuments(filter),
  ]);
  return { data, pagination: { page, limit, total } };
}

export async function createReview(movieId: string, input: CreateReviewInput, userId: string) {
  await getMovie(movieId);
  if (await Review.exists({ movie: movieId, user: userId })) {
    throw new AppError(409, 'You already reviewed this movie');
  }
  const review = await Review.create({ ...input, movie: movieId, user: userId });
  await recalculateMovieRating(movieId);
  return review;
}

async function getOwnedReview(id: string, user: AuthUser) {
  const review = await Review.findById(id);
  if (!review) throw new AppError(404, 'Review not found');
  assertOwnerOrAdmin(review.user, user);
  return review;
}

export async function updateReview(id: string, input: UpdateReviewInput, user: AuthUser) {
  const review = await getOwnedReview(id, user);
  review.set(input);
  await review.save();
  await recalculateMovieRating(review.movie);
  return review;
}

export async function deleteReview(id: string, user: AuthUser) {
  const review = await getOwnedReview(id, user);
  await review.deleteOne();
  await recalculateMovieRating(review.movie);
}

export async function getMovieRating(movieId: string) {
  const { averageRating, reviewsCount } = await getMovie(movieId);
  return { averageRating, reviewsCount };
}
