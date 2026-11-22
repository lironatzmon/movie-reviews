import { authenticate, authorize } from '../../../src/middlewares/auth';
import { AppError } from '../../../src/utils/AppError';
import { signToken } from '../../../src/utils/jwt';
import { mockRequest, mockResponse } from '../../helpers/http';

describe('authenticate', () => {
  it('sets req.user from a valid Bearer token', () => {
    const req = mockRequest({
      headers: { authorization: `Bearer ${signToken({ id: 'u1', role: 'user' })}` },
    });
    const next = jest.fn();

    authenticate(req, mockResponse(), next);

    expect(req.user).toEqual({ id: 'u1', role: 'user' });
    expect(next).toHaveBeenCalledWith();
  });

  it.each([
    ['no header', undefined],
    ['wrong scheme', 'Basic abc'],
    ['invalid token', 'Bearer bad.token'],
  ])('returns 401 for %s', (_case, authorization) => {
    const req = mockRequest({ headers: { authorization } });
    const next = jest.fn();

    authenticate(req, mockResponse(), next);

    const error = next.mock.calls[0][0] as AppError;
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(401);
  });
});

describe('authorize', () => {
  it('allows a user with a permitted role', () => {
    const req = mockRequest({ user: { id: 'u1', role: 'admin' } });
    const next = jest.fn();

    authorize('admin')(req, mockResponse(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it('returns 403 for a role that is not permitted', () => {
    const req = mockRequest({ user: { id: 'u1', role: 'user' } });
    const next = jest.fn();

    authorize('admin')(req, mockResponse(), next);

    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(403);
  });

  it('returns 401 when there is no user', () => {
    const next = jest.fn();

    authorize('admin')(mockRequest(), mockResponse(), next);

    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(401);
  });
});
