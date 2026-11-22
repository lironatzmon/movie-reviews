import { FilterQuery, SortOrder } from 'mongoose';
import { Movie, MovieDoc } from '../models/Movie';
import { Review } from '../models/Review';
import { AuthUser } from '../types/auth';
import { AppError } from '../utils/AppError';
import { pageMeta, skipFor } from '../utils/pagination';
import { assertOwnerOrAdmin } from '../utils/ownership';
import {
  CreateMovieInput,
  ListMoviesQuery,
  MOVIE_SORTS,
  UpdateMovieInput,
} from '../validators/movie.validator';

const SORT_FIELDS: Record<(typeof MOVIE_SORTS)[number], Record<string, SortOrder>> = {
  rating: { averageRating: 1 },
  '-rating': { averageRating: -1 },
  year: { releaseYear: 1 },
  '-year': { releaseYear: -1 },
  title: { title: 1 },
};
const DEFAULT_SORT: Record<string, SortOrder> = { createdAt: -1 };

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const contains = (text: string) => new RegExp(escapeRegex(text), 'i');
const equalsIgnoreCase = (text: string) => new RegExp(`^${escapeRegex(text)}$`, 'i');

function buildFilter({ search, genre, year, director }: ListMoviesQuery): FilterQuery<MovieDoc> {
  return {
    ...(search && { title: contains(search) }),
    ...(genre && { genres: equalsIgnoreCase(genre) }),
    ...(year && { releaseYear: year }),
    ...(director && { director: equalsIgnoreCase(director) }),
  };
}

export async function listMovies(query: ListMoviesQuery) {
  const filter = buildFilter(query);
  const [data, total] = await Promise.all([
    Movie.find(filter)
      .sort({ ...(query.sort ? SORT_FIELDS[query.sort] : DEFAULT_SORT), _id: 1 })
      .skip(skipFor(query))
      .limit(query.limit),
    Movie.countDocuments(filter),
  ]);
  return { data, pagination: pageMeta(query, total) };
}

export async function getMovie(id: string) {
  const movie = await Movie.findById(id);
  if (!movie) throw new AppError(404, 'Movie not found');
  return movie;
}

export function createMovie(input: CreateMovieInput, userId: string) {
  return Movie.create({ ...input, createdBy: userId });
}

async function getOwnedMovie(id: string, user: AuthUser) {
  const movie = await getMovie(id);
  assertOwnerOrAdmin(movie.createdBy, user);
  return movie;
}

export async function updateMovie(id: string, input: UpdateMovieInput, user: AuthUser) {
  const movie = await getOwnedMovie(id, user);
  movie.set(input);
  return movie.save();
}

export async function deleteMovie(id: string, user: AuthUser) {
  const movie = await getOwnedMovie(id, user);
  await Review.deleteMany({ movie: movie._id });
  await movie.deleteOne();
}
