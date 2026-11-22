import {
  createMovieSchema,
  listMoviesQuerySchema,
  updateMovieSchema,
} from '../../../src/validators/movie.validator';
import { movieInput } from '../../helpers/movies';

const maxYear = new Date().getFullYear() + 5;

describe('createMovieSchema', () => {
  it('accepts a valid movie and trims the title', () => {
    const result = createMovieSchema.parse(movieInput({ title: '  Inception  ' }));

    expect(result.title).toBe('Inception');
  });

  it('strips read-only and unknown fields', () => {
    const result = createMovieSchema.parse(
      movieInput({ averageRating: 9, reviewsCount: 3, createdBy: 'x', foo: 1 }),
    );

    expect(result).not.toHaveProperty('averageRating');
    expect(result).not.toHaveProperty('reviewsCount');
    expect(result).not.toHaveProperty('createdBy');
    expect(result).not.toHaveProperty('foo');
  });

  it.each([
    ['missing title', { title: undefined }],
    ['blank title', { title: '   ' }],
    ['year before 1888', { releaseYear: 1887 }],
    ['year too far in the future', { releaseYear: maxYear + 1 }],
    ['non-integer year', { releaseYear: 2010.5 }],
    ['no genres', { genres: [] }],
    ['missing director', { director: undefined }],
  ])('rejects %s', (_case, overrides) => {
    expect(createMovieSchema.safeParse(movieInput(overrides)).success).toBe(false);
  });

  it('accepts the boundary years', () => {
    expect(createMovieSchema.safeParse(movieInput({ releaseYear: 1888 })).success).toBe(true);
    expect(createMovieSchema.safeParse(movieInput({ releaseYear: maxYear })).success).toBe(true);
  });
});

describe('updateMovieSchema', () => {
  it('accepts a partial update', () => {
    expect(updateMovieSchema.parse({ title: 'New' })).toEqual({ title: 'New' });
  });

  it('rejects an empty update', () => {
    expect(updateMovieSchema.safeParse({}).success).toBe(false);
  });

  it('rejects invalid fields', () => {
    expect(updateMovieSchema.safeParse({ genres: [] }).success).toBe(false);
  });
});

describe('listMoviesQuerySchema', () => {
  it('applies defaults', () => {
    expect(listMoviesQuerySchema.parse({})).toEqual({ page: 1, limit: 10 });
  });

  it('coerces numbers from strings', () => {
    expect(listMoviesQuerySchema.parse({ page: '2', limit: '5', year: '2010' })).toMatchObject({
      page: 2,
      limit: 5,
      year: 2010,
    });
  });

  it.each([{ limit: '51' }, { page: '0' }, { sort: 'price' }])('rejects %o', (query) => {
    expect(listMoviesQuerySchema.safeParse(query).success).toBe(false);
  });

  it.each(['rating', '-rating', 'year', '-year', 'title'])('accepts sort=%s', (sort) => {
    expect(listMoviesQuerySchema.safeParse({ sort }).success).toBe(true);
  });
});
