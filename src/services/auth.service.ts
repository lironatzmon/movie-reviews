import bcrypt from 'bcryptjs';
import { User, UserDocument } from '../models/User';
import { AppError } from '../utils/AppError';
import { signToken } from '../utils/jwt';
import { LoginInput, RegisterInput } from '../validators/auth.validator';

const SALT_ROUNDS = 10;

function withToken(user: UserDocument) {
  return { user, token: signToken({ id: user.id, role: user.role }) };
}

export async function register({ name, email, password }: RegisterInput) {
  if (await User.exists({ email })) throw new AppError(409, 'Email already in use');

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email, password: hashed });
  return withToken(user);
}

export async function login({ email, password }: LoginInput) {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError(401, 'Invalid email or password');
  }
  return withToken(user);
}

export async function getMe(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');
  return user;
}
