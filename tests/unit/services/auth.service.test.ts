import bcrypt from 'bcryptjs';
import { User } from '../../../src/models/User';
import * as authService from '../../../src/services/auth.service';
import { verifyToken } from '../../../src/utils/jwt';

jest.mock('../../../src/models/User');
const UserMock = jest.mocked(User);

const fakeUser = { id: '507f1f77bcf86cd799439011', role: 'user', password: 'hash' };

afterEach(() => jest.resetAllMocks());

describe('authService.register', () => {
  it('throws 409 when the email is taken', async () => {
    UserMock.exists.mockResolvedValue({ _id: fakeUser.id } as never);

    await expect(
      authService.register({ name: 'A', email: 'a@b.com', password: 'secret123' }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('hashes the password and returns a token for the new user', async () => {
    UserMock.exists.mockResolvedValue(null);
    UserMock.create.mockResolvedValue(fakeUser as never);

    const { token } = await authService.register({
      name: 'A',
      email: 'a@b.com',
      password: 'secret123',
    });

    const saved = UserMock.create.mock.calls[0][0] as unknown as { password: string };
    expect(saved.password).not.toBe('secret123');
    expect(await bcrypt.compare('secret123', saved.password)).toBe(true);
    expect(verifyToken(token)).toEqual({ id: fakeUser.id, role: 'user' });
  });
});

describe('authService.login', () => {
  function mockFindOne(result: unknown) {
    UserMock.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(result) } as never);
  }

  it('throws 401 for an unknown email', async () => {
    mockFindOne(null);

    await expect(authService.login({ email: 'x@y.com', password: 'p' })).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('throws 401 for a wrong password', async () => {
    mockFindOne({ ...fakeUser, password: await bcrypt.hash('right-pass', 4) });

    await expect(
      authService.login({ email: 'a@b.com', password: 'wrong-pass' }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});
