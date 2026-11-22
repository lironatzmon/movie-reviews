import request from 'supertest';
import { Types } from 'mongoose';
import app from '../../src/app';
import * as db from '../helpers/db';
import { bearer, makeUser } from '../helpers/auth';
import { movieInput } from '../helpers/movies';

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

const owner = makeUser();
const missingId = new Types.ObjectId().toString();

async function createMovie(overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/movies')
    .set('Authorization', bearer(owner))
    .send(movieInput(overrides));
  return res.body.data;
}

describe('POST /api/movies', () => {
  it('creates a movie for the authenticated user', async () => {
    const res = await request(app)
      .post('/api/movies')
      .set('Authorization', bearer(owner))
      .send(movieInput({ createdBy: missingId, averageRating: 10, reviewsCount: 5 }));

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      title: 'Inception',
      createdBy: owner.id,
      averageRating: 0,
      reviewsCount: 0,
    });
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/movies').send(movieInput());

    expect(res.status).toBe(401);
  });

  it('returns 400 for an invalid body', async () => {
    const res = await request(app)
      .post('/api/movies')
      .set('Authorization', bearer(owner))
      .send(movieInput({ genres: [] }));

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([expect.objectContaining({ path: 'genres' })]);
  });
});

describe('GET /api/movies', () => {
  it('lists movies with pagination', async () => {
    await createMovie({ title: 'Inception' });
    await createMovie({ title: 'Interstellar' });

    const res = await request(app).get('/api/movies?limit=1&sort=title');

    expect(res.status).toBe(200);
    expect(res.body.data.map((m: { title: string }) => m.title)).toEqual(['Inception']);
    expect(res.body.pagination).toEqual({ page: 1, limit: 1, total: 2 });
  });

  it('filters with query params', async () => {
    await createMovie({ title: 'Inception' });
    await createMovie({ title: 'Interstellar', releaseYear: 2014 });

    const res = await request(app).get('/api/movies?search=STELL&year=2014');

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Interstellar');
  });

  it('returns 400 when limit is above 50', async () => {
    const res = await request(app).get('/api/movies?limit=51');

    expect(res.status).toBe(400);
  });
});

describe('GET /api/movies/:id', () => {
  it('returns the movie with rating fields', async () => {
    const movie = await createMovie();

    const res = await request(app).get(`/api/movies/${movie.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ title: 'Inception', averageRating: 0, reviewsCount: 0 });
  });

  it('returns 400 for an invalid id', async () => {
    const res = await request(app).get('/api/movies/not-an-id');

    expect(res.status).toBe(400);
  });

  it('returns 404 for a missing movie', async () => {
    const res = await request(app).get(`/api/movies/${missingId}`);

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/movies/:id', () => {
  it('lets the owner update', async () => {
    const movie = await createMovie();

    const res = await request(app)
      .put(`/api/movies/${movie.id}`)
      .set('Authorization', bearer(owner))
      .send({ title: 'New title' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('New title');
  });

  it('ignores read-only fields', async () => {
    const movie = await createMovie();

    const res = await request(app)
      .put(`/api/movies/${movie.id}`)
      .set('Authorization', bearer(owner))
      .send({ title: 'New title', averageRating: 10, createdBy: missingId });

    expect(res.body.data).toMatchObject({ averageRating: 0, createdBy: owner.id });
  });

  it('lets an admin update', async () => {
    const movie = await createMovie();

    const res = await request(app)
      .put(`/api/movies/${movie.id}`)
      .set('Authorization', bearer(makeUser('admin')))
      .send({ title: 'New title' });

    expect(res.status).toBe(200);
  });

  it('returns 403 for another user', async () => {
    const movie = await createMovie();

    const res = await request(app)
      .put(`/api/movies/${movie.id}`)
      .set('Authorization', bearer(makeUser()))
      .send({ title: 'New title' });

    expect(res.status).toBe(403);
  });

  it('returns 401 without a token', async () => {
    const movie = await createMovie();

    const res = await request(app).put(`/api/movies/${movie.id}`).send({ title: 'New title' });

    expect(res.status).toBe(401);
  });

  it('returns 404 for a missing movie', async () => {
    const res = await request(app)
      .put(`/api/movies/${missingId}`)
      .set('Authorization', bearer(owner))
      .send({ title: 'New title' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/movies/:id', () => {
  it('lets the owner delete', async () => {
    const movie = await createMovie();

    const res = await request(app)
      .delete(`/api/movies/${movie.id}`)
      .set('Authorization', bearer(owner));

    expect(res.status).toBe(204);
    expect((await request(app).get(`/api/movies/${movie.id}`)).status).toBe(404);
  });

  it('lets an admin delete', async () => {
    const movie = await createMovie();

    const res = await request(app)
      .delete(`/api/movies/${movie.id}`)
      .set('Authorization', bearer(makeUser('admin')));

    expect(res.status).toBe(204);
  });

  it('returns 403 for another user', async () => {
    const movie = await createMovie();

    const res = await request(app)
      .delete(`/api/movies/${movie.id}`)
      .set('Authorization', bearer(makeUser()));

    expect(res.status).toBe(403);
  });

  it('returns 400 for an invalid id', async () => {
    const res = await request(app)
      .delete('/api/movies/not-an-id')
      .set('Authorization', bearer(owner));

    expect(res.status).toBe(400);
  });
});

describe('Swagger', () => {
  it('documents every movie endpoint', async () => {
    const { body } = await request(app).get('/api-docs.json');

    expect(Object.keys(body.paths['/api/movies'])).toEqual(expect.arrayContaining(['get', 'post']));
    expect(Object.keys(body.paths['/api/movies/{id}'])).toEqual(
      expect.arrayContaining(['get', 'put', 'delete']),
    );
  });
});
