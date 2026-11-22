import * as userService from '../../src/services/user.service';
import { User } from '../../src/models/User';
import * as db from '../helpers/db';
import { createUser } from '../helpers/auth';

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

describe('userService with a real database', () => {
  it('lists users newest first with pagination', async () => {
    const first = await createUser();
    const second = await createUser();

    const { users, pagination } = await userService.listUsers({ page: 1, limit: 1 });

    expect(users.map((u) => u.id)).toEqual([second.id]);
    expect(pagination).toEqual({ page: 1, limit: 1, total: 2 });
    expect(first.id).not.toBe(second.id);
  });

  it('updates the role of another user', async () => {
    const admin = await createUser('admin');
    const target = await createUser();

    const updated = await userService.updateRole(admin.id, target.id, 'admin');

    expect(updated.role).toBe('admin');
  });

  it('does not let an admin change their own role', async () => {
    const admin = await createUser('admin');

    await expect(userService.updateRole(admin.id, admin.id, 'user')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('deletes another user', async () => {
    const admin = await createUser('admin');
    const target = await createUser();

    await userService.deleteUser(admin.id, target.id);

    expect(await User.exists({ _id: target.id })).toBeNull();
  });

  it('does not let an admin delete themselves', async () => {
    const admin = await createUser('admin');

    await expect(userService.deleteUser(admin.id, admin.id)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('throws 404 for a missing user', async () => {
    const admin = await createUser('admin');
    const missingId = '507f1f77bcf86cd799439011';

    await expect(userService.getUser(missingId)).rejects.toMatchObject({ statusCode: 404 });
    await expect(userService.deleteUser(admin.id, missingId)).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
