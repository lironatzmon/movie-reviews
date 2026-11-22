import { FilterQuery, SortOrder } from 'mongoose';
import { Movie, MovieDoc } from '../models/Movie';
import { AuthUser } from '../types/auth';
import { AppError } from '../utils/AppError';
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
  const { page, limit, sort } = query;
  const filter = buildFilter(query);
  const [data, total] = await Promise.all([
    Movie.find(filter)
      .sort({ ...(sort ? SORT_FIELDS[sort] : DEFAULT_SORT), _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Movie.countDocuments(filter),
  ]);
  return { data, pagination: { page, limit, total } };
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
  if (user.role !== 'admin' && movie.createdBy.toString() !== user.id) {
    throw new AppError(403, 'You are not allowed to modify this movie');
  }
  return movie;
}

export async function updateMovie(id: string, input: UpdateMovieInput, user: AuthUser) {
  const movie = await getOwnedMovie(id, user);
  movie.set(input);
  return movie.save();
}

export async function deleteMovie(id: string, user: AuthUser) {
  const movie = await getOwnedMovie(id, user);
  await movie.deleteOne();
}
