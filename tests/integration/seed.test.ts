import { Movie } from '../../src/models/Movie';
import { Review } from '../../src/models/Review';
import { User } from '../../src/models/User';
import { seed, SEED_USERS } from '../../src/scripts/seed';
import * as authService from '../../src/services/auth.service';
import * as db from '../helpers/db';

beforeAll(db.connect);
afterAll(db.close);

describe('seed', () => {
  beforeAll(() => seed());

  it('creates an admin and a regular user that can log in', async () => {
    const { user: admin } = await authService.login(SEED_USERS.admin);
    const { user } = await authService.login(SEED_USERS.user);

    expect(admin.role).toBe('admin');
    expect(user.role).toBe('user');
  });

  it('creates movies with reviews and a calculated rating', async () => {
    const movies = await Movie.find();

    expect(movies.length).toBeGreaterThan(0);
    const rated = movies.filter((movie) => movie.reviewsCount > 0);
    expect(rated.length).toBeGreaterThan(0);
    expect(rated.every((movie) => movie.averageRating > 0)).toBe(true);
  });

  it('can run again without duplicating data', async () => {
    const before = await Promise.all([User, Movie, Review].map((m) => m.countDocuments()));

    await seed();

    const after = await Promise.all([User, Movie, Review].map((m) => m.countDocuments()));
    expect(after).toEqual(before);
  });
});
