import { loginSchema, registerSchema } from '../../../src/validators/auth.validator';

const valid = { name: 'Liron', email: 'Liron@Example.com ', password: 'secret123' };

describe('registerSchema', () => {
  it('normalizes email and strips unknown fields such as role', () => {
    const result = registerSchema.parse({ ...valid, role: 'admin' });

    expect(result).toEqual({ name: 'Liron', email: 'liron@example.com', password: 'secret123' });
  });

  it.each([
    ['short name', { name: 'L' }],
    ['invalid email', { email: 'nope' }],
    ['short password', { password: '1234567' }],
  ])('rejects %s', (_case, override) => {
    expect(registerSchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('requires email and password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com' }).success).toBe(false);
  });
});
