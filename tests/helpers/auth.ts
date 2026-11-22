import { User } from '../../src/models/User';
import * as authService from '../../src/services/auth.service';
import { Role } from '../../src/types/auth';

let counter = 0;

/** Creates a user in the test DB and returns it with a valid token. */
export async function createUser(role: Role = 'user') {
  counter += 1;
  const { user } = await authService.register({
    name: `User ${counter}`,
    email: `user${counter}@example.com`,
    password: 'secret123',
  });
  if (role !== 'user') await User.updateOne({ _id: user.id }, { role });
  const { token } = await authService.login({ email: user.email, password: 'secret123' });
  return { id: user.id as string, email: user.email, role, token };
}
