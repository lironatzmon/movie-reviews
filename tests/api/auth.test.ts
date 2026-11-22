import request from 'supertest';
import app from '../../src/app';
import * as db from '../helpers/db';

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

const user = { name: 'Liron', email: 'liron@example.com', password: 'secret123' };

const register = () => request(app).post('/api/auth/register').send(user);

describe('POST /api/auth/register', () => {
  it('returns 201 with the user (no password) and a token', async () => {
    const res = await register();

    expect(res.status).toBe(201);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({ name: 'Liron', email: user.email, role: 'user' });
    expect(res.body.data.user.id).toEqual(expect.any(String));
    expect(res.body.data.user).not.toHaveProperty('password');
    expect(res.body.data.user).not.toHaveProperty('_id');
  });

  it('ignores a role sent by the client', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...user, role: 'admin' });

    expect(res.body.data.user.role).toBe('user');
  });

  it('returns 409 for a duplicate email', async () => {
    await register();

    const res = await register();

    expect(res.status).toBe(409);
  });

  it('returns 400 for invalid input', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'bad' });

    expect(res.status).toBe(400);
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });
});

describe('POST /api/auth/login', () => {
  it('returns 200 and a token for valid credentials', async () => {
    await register();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
  });

  it('returns 401 for a wrong password', async () => {
    await register();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'wrong-pass' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user for a valid token', async () => {
    const { token } = (await register()).body.data;

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(user.email);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
  });
});
