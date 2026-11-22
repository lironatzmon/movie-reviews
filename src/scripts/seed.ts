import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { env } from '../config/env';
import { Movie } from '../models/Movie';
import { Review } from '../models/Review';
import { User } from '../models/User';
import * as authService from '../services/auth.service';
import * as movieService from '../services/movie.service';
import * as reviewService from '../services/review.service';
import { CreateMovieInput } from '../validators/movie.validator';

export const SEED_USERS = {
  admin: { name: 'Admin', email: 'admin@example.com', password: 'admin1234' },
  user: { name: 'Demo User', email: 'user@example.com', password: 'user12345' },
};

const MOVIES: CreateMovieInput[] = [
  {
    title: 'Inception',
    releaseYear: 2010,
    genres: ['Sci-Fi', 'Action'],
    director: 'Christopher Nolan',
    actors: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page'],
    description: 'A thief who steals secrets through dreams is given a final job.',
  },
  {
    title: 'Spirited Away',
    releaseYear: 2001,
    genres: ['Animation', 'Fantasy'],
    director: 'Hayao Miyazaki',
    actors: ['Rumi Hiiragi', 'Miyu Irino'],
    description: 'A girl wanders into a world ruled by gods and spirits.',
  },
  {
    title: 'The Godfather',
    releaseYear: 1972,
    genres: ['Crime', 'Drama'],
    director: 'Francis Ford Coppola',
    actors: ['Marlon Brando', 'Al Pacino'],
    description: 'The aging head of a crime family hands control to his son.',
  },
];

const REVIEWS: { movie: number; by: keyof typeof SEED_USERS; rating: number; text: string }[] = [
  { movie: 0, by: 'admin', rating: 9.5, text: 'Mind-bending and beautifully made.' },
  { movie: 0, by: 'user', rating: 8.5, text: 'Great, but you need to pay attention.' },
  { movie: 1, by: 'user', rating: 10, text: 'Pure magic.' },
  { movie: 2, by: 'admin', rating: 9, text: 'A true classic.' },
];

async function createUsers() {
  const { user: admin } = await authService.register(SEED_USERS.admin);
  await User.updateOne({ _id: admin.id }, { role: 'admin' });
  const { user } = await authService.register(SEED_USERS.user);
  return { admin: admin.id as string, user: user.id as string };
}

/** Resets users, movies and reviews and fills them with demo data. Development only. */
export async function seed(): Promise<void> {
  await Promise.all([User.deleteMany({}), Movie.deleteMany({}), Review.deleteMany({})]);

  const userIds = await createUsers();
  const movies = await Promise.all(
    MOVIES.map((movie) => movieService.createMovie(movie, userIds.admin)),
  );

  for (const { movie, by, rating, text } of REVIEWS) {
    await reviewService.createReview(movies[movie].id, { rating, text }, userIds[by]);
  }
}

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to seed in production');

  await connectDB(env.mongoUri);
  await seed();
  console.log('Seed complete. Log in with:');
  console.table(SEED_USERS);
  await mongoose.disconnect();
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
