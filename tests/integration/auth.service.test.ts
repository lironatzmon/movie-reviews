import { User } from '../../src/models/User';
import * as authService from '../../src/services/auth.service';
import * as db from '../helpers/db';

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

const input = { name: 'Rom', email: 'rom@example.com', password: 'secret123' };

describe('authService with a real database', () => {
  it('stores a hashed password that is not selected by default', async () => {
    await authService.register(input);

    const stored = await User.findOne({ email: input.email });
    const withPassword = await User.findOne({ email: input.email }).select('+password');

    expect(stored?.password).toBeUndefined();
    expect(withPassword?.password).not.toBe(input.password);
  });

  it('new users get the "user" role', async () => {
    const { user } = await authService.register(input);

    expect(user.role).toBe('user');
  });

  it('logs in with the registered credentials', async () => {
    await authService.register(input);

    const { user, token } = await authService.login({
      email: input.email,
      password: input.password,
    });

    expect(user.email).toBe(input.email);
    expect(token).toEqual(expect.any(String));
  });

  it('getMe throws 404 for a deleted user', async () => {
    const { user } = await authService.register(input);
    await User.deleteOne({ _id: user.id });

    await expect(authService.getMe(user.id)).rejects.toMatchObject({ statusCode: 404 });
  });
});
