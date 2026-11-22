import { z } from 'zod';
import { validate } from '../../../src/middlewares/validate';
import { AppError } from '../../../src/utils/AppError';
import { mockRequest, mockResponse } from '../../helpers/http';

const schemas = {
  body: z.object({ title: z.string().min(1) }),
  query: z.object({ page: z.coerce.number().int().min(1).default(1) }),
};

describe('validate', () => {
  it('replaces req parts with parsed data and calls next', () => {
    const req = mockRequest({ body: { title: 'Up', extra: 1 }, query: { page: '2' } });
    const next = jest.fn();

    validate(schemas)(req, mockResponse(), next);

    expect(req.body).toEqual({ title: 'Up' });
    expect(req.query).toEqual({ page: 2 });
    expect(next).toHaveBeenCalledWith();
  });

  it('passes a 400 AppError with details for every invalid part', () => {
    const req = mockRequest({ body: {}, query: { page: '0' } });
    const next = jest.fn();

    validate(schemas)(req, mockResponse(), next);

    const error = next.mock.calls[0][0] as AppError;
    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual([
      expect.objectContaining({ location: 'body', path: 'title' }),
      expect.objectContaining({ location: 'query', path: 'page' }),
    ]);
  });
});
