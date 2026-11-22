import { authenticate, authorize } from '../../../src/middlewares/auth';
import { User } from '../../../src/models/User';
import { AppError } from '../../../src/utils/AppError';
import { signToken } from '../../../src/utils/jwt';
import { mockRequest, mockResponse } from '../../helpers/http';

jest.mock('../../../src/models/User');
const UserMock = jest.mocked(User);

const bearer = (role: 'user' | 'admin' = 'user') => `Bearer ${signToken({ id: 'u1', role })}`;

afterEach(() => jest.resetAllMocks());

describe('authenticate', () => {
  it('sets req.user with the current role from the database', async () => {
    UserMock.findById.mockResolvedValue({ role: 'admin' } as never);
    const req = mockRequest({ headers: { authorization: bearer('user') } });
    const next = jest.fn();

    await authenticate(req, mockResponse(), next);

    expect(UserMock.findById).toHaveBeenCalledWith('u1', 'role');
    expect(req.user).toEqual({ id: 'u1', role: 'admin' });
    expect(next).toHaveBeenCalledWith();
  });

  it('returns 401 when the user no longer exists', async () => {
    UserMock.findById.mockResolvedValue(null);
    const req = mockRequest({ headers: { authorization: bearer() } });
    const next = jest.fn();

    await authenticate(req, mockResponse(), next);

    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(401);
    expect(req.user).toBeUndefined();
  });

  it.each([
    ['no header', undefined],
    ['wrong scheme', 'Basic abc'],
    ['invalid token', 'Bearer bad.token'],
  ])('returns 401 for %s', async (_case, authorization) => {
    const req = mockRequest({ headers: { authorization } });
    const next = jest.fn();

    await authenticate(req, mockResponse(), next);

    const error = next.mock.calls[0][0] as AppError;
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(401);
    expect(UserMock.findById).not.toHaveBeenCalled();
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
