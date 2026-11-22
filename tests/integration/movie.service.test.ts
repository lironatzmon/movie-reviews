import { Types } from 'mongoose';
import { Movie } from '../../src/models/Movie';
import * as movieService from '../../src/services/movie.service';
import { AppError } from '../../src/utils/AppError';
import * as db from '../helpers/db';
import { makeUser } from '../helpers/auth';
import { movieInput } from '../helpers/movies';

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

const owner = makeUser();
const missingId = new Types.ObjectId().toString();

async function expectAppError(promise: Promise<unknown>, statusCode: number) {
  await expect(promise).rejects.toBeInstanceOf(AppError);
  await expect(promise).rejects.toMatchObject({ statusCode });
}

async function seed() {
  const inputs = [
    movieInput({ title: 'Inception', releaseYear: 2010, genres: ['Sci-Fi'] }),
    movieInput({ title: 'Interstellar', releaseYear: 2014, genres: ['Sci-Fi', 'Drama'] }),
    movieInput({
      title: 'Pulp Fiction',
      releaseYear: 1994,
      genres: ['Crime'],
      director: 'Quentin Tarantino',
    }),
  ];
  const [a, b, c] = await Promise.all(
    inputs.map((input) => movieService.createMovie(input, owner.id)),
  );
  await Movie.updateOne({ _id: a._id }, { averageRating: 8 });
  await Movie.updateOne({ _id: b._id }, { averageRating: 9 });
  await Movie.updateOne({ _id: c._id }, { averageRating: 7 });
}

describe('createMovie', () => {
  it('stores the movie with createdBy and zeroed rating', async () => {
    const movie = await movieService.createMovie(movieInput(), owner.id);

    expect(movie.createdBy.toString()).toBe(owner.id);
    expect(movie.averageRating).toBe(0);
    expect(movie.reviewsCount).toBe(0);
  });
});

describe('getMovie', () => {
  it('returns the movie', async () => {
    const created = await movieService.createMovie(movieInput(), owner.id);

    const movie = await movieService.getMovie(created.id);

    expect(movie.title).toBe('Inception');
  });

  it('throws 404 for a missing movie', async () => {
    await expectAppError(movieService.getMovie(missingId), 404);
  });
});

describe('listMovies', () => {
  beforeEach(seed);

  const titles = (result: { data: { title: string }[] }) => result.data.map((m) => m.title);

  it('paginates and returns the total', async () => {
    const result = await movieService.listMovies({ page: 2, limit: 2 });

    expect(result.data).toHaveLength(1);
    expect(result.pagination).toEqual({ page: 2, limit: 2, total: 3 });
  });

  it('searches the title case-insensitively', async () => {
    const result = await movieService.listMovies({ page: 1, limit: 10, search: 'inter' });

    expect(titles(result)).toEqual(['Interstellar']);
  });

  it('treats search as plain text, not a regex', async () => {
    const result = await movieService.listMovies({ page: 1, limit: 10, search: '.*' });

    expect(result.data).toHaveLength(0);
  });

  it('filters by genre, year and director', async () => {
    const base = { page: 1, limit: 10 };

    expect(titles(await movieService.listMovies({ ...base, genre: 'drama' }))).toEqual([
      'Interstellar',
    ]);
    expect(titles(await movieService.listMovies({ ...base, year: 1994 }))).toEqual([
      'Pulp Fiction',
    ]);
    expect(
      titles(await movieService.listMovies({ ...base, director: 'quentin tarantino' })),
    ).toEqual(['Pulp Fiction']);
  });

  it.each([
    ['-rating', ['Interstellar', 'Inception', 'Pulp Fiction']],
    ['rating', ['Pulp Fiction', 'Inception', 'Interstellar']],
    ['year', ['Pulp Fiction', 'Inception', 'Interstellar']],
    ['-year', ['Interstellar', 'Inception', 'Pulp Fiction']],
    ['title', ['Inception', 'Interstellar', 'Pulp Fiction']],
  ] as const)('sorts by %s', async (sort, expected) => {
    const result = await movieService.listMovies({ page: 1, limit: 10, sort });

    expect(titles(result)).toEqual(expected);
  });
});

describe('updateMovie', () => {
  it('lets the owner update', async () => {
    const created = await movieService.createMovie(movieInput(), owner.id);

    const movie = await movieService.updateMovie(created.id, { title: 'New' }, owner);

    expect(movie.title).toBe('New');
  });

  it('lets an admin update', async () => {
    const created = await movieService.createMovie(movieInput(), owner.id);

    const movie = await movieService.updateMovie(created.id, { title: 'New' }, makeUser('admin'));

    expect(movie.title).toBe('New');
  });

  it('throws 403 for another user', async () => {
    const created = await movieService.createMovie(movieInput(), owner.id);

    await expectAppError(movieService.updateMovie(created.id, { title: 'New' }, makeUser()), 403);
  });

  it('throws 404 for a missing movie', async () => {
    await expectAppError(movieService.updateMovie(missingId, { title: 'New' }, owner), 404);
  });
});

describe('deleteMovie', () => {
  it('lets the owner delete', async () => {
    const created = await movieService.createMovie(movieInput(), owner.id);

    await movieService.deleteMovie(created.id, owner);

    expect(await Movie.findById(created.id)).toBeNull();
  });

  it('lets an admin delete', async () => {
    const created = await movieService.createMovie(movieInput(), owner.id);

    await movieService.deleteMovie(created.id, makeUser('admin'));

    expect(await Movie.findById(created.id)).toBeNull();
  });

  it('throws 403 for another user and keeps the movie', async () => {
    const created = await movieService.createMovie(movieInput(), owner.id);

    await expectAppError(movieService.deleteMovie(created.id, makeUser()), 403);
    expect(await Movie.findById(created.id)).not.toBeNull();
  });

  it('throws 404 for a missing movie', async () => {
    await expectAppError(movieService.deleteMovie(missingId, owner), 404);
  });
});
