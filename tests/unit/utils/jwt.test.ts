import { signToken, verifyToken } from '../../../src/utils/jwt';

describe('jwt utils', () => {
  it('signs a token and verifies it back to the same user', () => {
    const token = signToken({ id: 'user-1', role: 'admin' });

    expect(verifyToken(token)).toEqual({ id: 'user-1', role: 'admin' });
  });

  it('throws on an invalid token', () => {
    expect(() => verifyToken('not-a-token')).toThrow();
  });
});
