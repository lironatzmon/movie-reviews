import request from 'supertest';
import app from '../../src/app';
import * as db from '../helpers/db';
import { createUser } from '../helpers/auth';

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe('/api/users permissions', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/users');

    expect(res.status).toBe(401);
  });

  it('returns 403 for a regular user', async () => {
    const { token } = await createUser();

    const res = await request(app).get('/api/users').set(auth(token));

    expect(res.status).toBe(403);
  });
});

describe('admin user management', () => {
  it('GET /api/users returns a paginated list without passwords', async () => {
    const admin = await createUser('admin');
    await createUser();

    const res = await request(app).get('/api/users?page=1&limit=10').set(auth(admin.token));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).not.toHaveProperty('password');
    expect(res.body.pagination).toEqual({ page: 1, limit: 10, total: 2 });
  });

  it('GET /api/users/:id returns a single user', async () => {
    const admin = await createUser('admin');
    const target = await createUser();

    const res = await request(app).get(`/api/users/${target.id}`).set(auth(admin.token));

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(target.email);
  });

  it('GET /api/users/:id returns 400 for an invalid id', async () => {
    const admin = await createUser('admin');

    const res = await request(app).get('/api/users/not-an-id').set(auth(admin.token));

    expect(res.status).toBe(400);
  });

  it('PATCH /api/users/:id/role changes the role', async () => {
    const admin = await createUser('admin');
    const target = await createUser();

    const res = await request(app)
      .patch(`/api/users/${target.id}/role`)
      .set(auth(admin.token))
      .send({ role: 'admin' });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('admin');
  });

  it('PATCH /api/users/:id/role returns 400 for an unknown role', async () => {
    const admin = await createUser('admin');
    const target = await createUser();

    const res = await request(app)
      .patch(`/api/users/${target.id}/role`)
      .set(auth(admin.token))
      .send({ role: 'king' });

    expect(res.status).toBe(400);
  });

  it('DELETE /api/users/:id returns 204 and removes the user', async () => {
    const admin = await createUser('admin');
    const target = await createUser();

    const res = await request(app).delete(`/api/users/${target.id}`).set(auth(admin.token));
    const after = await request(app).get(`/api/users/${target.id}`).set(auth(admin.token));

    expect(res.status).toBe(204);
    expect(after.status).toBe(404);
  });
});
