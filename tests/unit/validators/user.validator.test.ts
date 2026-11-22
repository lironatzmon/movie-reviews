import { updateRoleSchema } from '../../../src/validators/user.validator';

describe('updateRoleSchema', () => {
  it.each(['user', 'admin'])('accepts role "%s"', (role) => {
    expect(updateRoleSchema.safeParse({ role }).success).toBe(true);
  });

  it('rejects an unknown role', () => {
    expect(updateRoleSchema.safeParse({ role: 'superuser' }).success).toBe(false);
  });
});
