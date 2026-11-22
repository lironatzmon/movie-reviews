import request from 'supertest';
import app from '../../src/app';

describe('app', () => {
  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nope');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { message: 'Route GET /api/nope not found' } });
  });

  it('serves the OpenAPI spec with JWT security scheme', async () => {
    const res = await request(app).get('/api-docs.json');

    expect(res.status).toBe(200);
    expect(res.body.components.securitySchemes.bearerAuth).toMatchObject({ scheme: 'bearer' });
    expect(res.body.paths['/health']).toBeDefined();
  });

  it('serves Swagger UI', async () => {
    const res = await request(app).get('/api-docs/');

    expect(res.status).toBe(200);
  });
});
