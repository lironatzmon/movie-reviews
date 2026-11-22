import express from 'express';
import mongoose from 'mongoose';
import request from 'supertest';
import { errorHandler } from '../../src/middlewares/errorHandler';
import * as db from '../helpers/db';

const Thing = mongoose.model(
  'Thing',
  new mongoose.Schema({ name: { type: String, required: true, unique: true } }),
);

const app = express();
app.use(express.json());
app.post('/things', async (req, res) => {
  res.status(201).json({ data: await Thing.create(req.body) });
});
app.get('/things/:id', async (req, res) => {
  res.json({ data: await Thing.findById(req.params.id) });
});
app.use(errorHandler);

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

describe('errorHandler with real Mongoose errors', () => {
  it('returns 409 on duplicate key', async () => {
    await Thing.init();
    await request(app).post('/things').send({ name: 'a' });

    const res = await request(app).post('/things').send({ name: 'a' });

    expect(res.status).toBe(409);
  });

  it('returns 400 on schema validation error', async () => {
    const res = await request(app).post('/things').send({});

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([expect.objectContaining({ path: 'name' })]);
  });

  it('returns 400 on invalid ObjectId', async () => {
    const res = await request(app).get('/things/not-an-id');

    expect(res.status).toBe(400);
  });
});
