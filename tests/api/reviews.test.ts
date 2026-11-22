import request from 'supertest';
import { Types } from 'mongoose';
import app from '../../src/app';
import { Review } from '../../src/models/Review';
import * as db from '../helpers/db';
import { bearer, createUser, TestUser } from '../helpers/auth';
import { movieInput } from '../helpers/movies';
import { reviewInput } from '../helpers/reviews';

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

let owner: TestUser;
let author: TestUser;
const missingId = new Types.ObjectId().toString();
let movieId: string;

beforeEach(async () => {
  owner = await createUser();
  author = await createUser();
  const res = await request(app)
    .post('/api/movies')
    .set('Authorization', bearer(owner))
    .send(movieInput());
  movieId = res.body.data.id;
});

const postReview = (body: object, user: TestUser = author, id = movieId) =>
  request(app).post(`/api/movies/${id}/reviews`).set('Authorization', bearer(user)).send(body);

const getRating = async () => (await request(app).get(`/api/movies/${movieId}/rating`)).body.data;

describe('POST /api/movies/:movieId/reviews', () => {
  it('creates a review and updates the movie rating', async () => {
    const res = await postReview(reviewInput({ rating: 8.5, user: missingId }));

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ rating: 8.5, user: author.id, movie: movieId });
    expect(await getRating()).toEqual({ averageRating: 8.5, reviewsCount: 1 });
  });

  it.each([8.3, 11])('returns 400 for rating %s', async (rating) => {
    const res = await postReview(reviewInput({ rating }));

    expect(res.status).toBe(400);
  });

  it('returns 409 for a duplicate review', async () => {
    await postReview(reviewInput());

    const res = await postReview(reviewInput({ rating: 5 }));

    expect(res.status).toBe(409);
  });

  it('returns 404 when the movie does not exist', async () => {
    const res = await postReview(reviewInput(), author, missingId);

    expect(res.status).toBe(404);
  });

  it('returns 400 for an invalid movie id', async () => {
    const res = await postReview(reviewInput(), author, 'nope');

    expect(res.status).toBe(400);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).post(`/api/movies/${movieId}/reviews`).send(reviewInput());

    expect(res.status).toBe(401);
  });
});

describe('GET /api/movies/:movieId/reviews', () => {
  it('lists reviews newest first with pagination', async () => {
    await postReview(reviewInput({ text: 'first' }));
    await postReview(reviewInput({ text: 'second' }), await createUser());

    const res = await request(app).get(`/api/movies/${movieId}/reviews?limit=1`);

    expect(res.status).toBe(200);
    expect(res.body.data.map((r: { text: string }) => r.text)).toEqual(['second']);
    expect(res.body.pagination).toEqual({ page: 1, limit: 1, total: 2 });
  });
});

describe('PUT /api/reviews/:id', () => {
  it('lets the owner edit and updates the average', async () => {
    const { body } = await postReview(reviewInput({ rating: 6 }));

    const res = await request(app)
      .put(`/api/reviews/${body.data.id}`)
      .set('Authorization', bearer(author))
      .send({ rating: 9, movie: missingId });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ rating: 9, movie: movieId });
    expect(await getRating()).toEqual({ averageRating: 9, reviewsCount: 1 });
  });

  it('returns 403 for another user', async () => {
    const { body } = await postReview(reviewInput());

    const res = await request(app)
      .put(`/api/reviews/${body.data.id}`)
      .set('Authorization', bearer(await createUser()))
      .send({ rating: 1 });

    expect(res.status).toBe(403);
  });

  it('lets an admin edit', async () => {
    const { body } = await postReview(reviewInput());

    const res = await request(app)
      .put(`/api/reviews/${body.data.id}`)
      .set('Authorization', bearer(await createUser('admin')))
      .send({ text: 'Moderated' });

    expect(res.status).toBe(200);
    expect(res.body.data.text).toBe('Moderated');
  });

  it('returns 404 for a missing review', async () => {
    const res = await request(app)
      .put(`/api/reviews/${missingId}`)
      .set('Authorization', bearer(author))
      .send({ rating: 1 });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/reviews/:id', () => {
  it('lets the owner delete and updates the average', async () => {
    const { body } = await postReview(reviewInput({ rating: 6 }));

    const res = await request(app)
      .delete(`/api/reviews/${body.data.id}`)
      .set('Authorization', bearer(author));

    expect(res.status).toBe(204);
    expect(await getRating()).toEqual({ averageRating: 0, reviewsCount: 0 });
  });

  it('returns 403 for another user', async () => {
    const { body } = await postReview(reviewInput());

    const res = await request(app)
      .delete(`/api/reviews/${body.data.id}`)
      .set('Authorization', bearer(await createUser()));

    expect(res.status).toBe(403);
  });

  it('lets an admin delete', async () => {
    const { body } = await postReview(reviewInput());

    const res = await request(app)
      .delete(`/api/reviews/${body.data.id}`)
      .set('Authorization', bearer(await createUser('admin')));

    expect(res.status).toBe(204);
  });
});

describe('GET /api/movies/:id/rating', () => {
  it('returns 0 and 0 without reviews', async () => {
    const res = await request(app).get(`/api/movies/${movieId}/rating`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { averageRating: 0, reviewsCount: 0 } });
  });

  it('returns 404 for a missing movie', async () => {
    const res = await request(app).get(`/api/movies/${missingId}/rating`);

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/movies/:id', () => {
  it('removes the movie reviews', async () => {
    await postReview(reviewInput());

    await request(app).delete(`/api/movies/${movieId}`).set('Authorization', bearer(owner));

    expect(await Review.countDocuments({ movie: movieId })).toBe(0);
  });
});

describe('Swagger', () => {
  it('documents every review endpoint', async () => {
    const { body } = await request(app).get('/api-docs.json');

    expect(Object.keys(body.paths['/api/movies/{movieId}/reviews'])).toEqual(
      expect.arrayContaining(['get', 'post']),
    );
    expect(Object.keys(body.paths['/api/reviews/{id}'])).toEqual(
      expect.arrayContaining(['put', 'delete']),
    );
    expect(body.paths['/api/movies/{id}/rating'].get).toBeDefined();
  });
});

describe('DELETE /api/users/:id', () => {
  it("removes the user's reviews and updates the movie rating", async () => {
    const { body } = await postReview(reviewInput({ rating: 10 }));
    await postReview(reviewInput({ rating: 6 }), await createUser());
    const admin = await createUser('admin');

    const res = await request(app)
      .delete(`/api/users/${author.id}`)
      .set('Authorization', bearer(admin));

    expect(res.status).toBe(204);
    expect(await Review.findById(body.data.id)).toBeNull();
    expect(await getRating()).toEqual({ averageRating: 6, reviewsCount: 1 });
  });
});
