import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { PageQuery, pageMeta, skipFor } from '../utils/pagination';
import { Role } from '../types/auth';
import { deleteReviewsByUser } from './review.service';

function assertNotSelf(actorId: string, targetId: string, action: string) {
  if (actorId === targetId) throw new AppError(400, `You cannot ${action} your own account`);
}

export async function listUsers(query: PageQuery) {
  const [users, total] = await Promise.all([
    User.find().sort({ createdAt: -1, _id: -1 }).skip(skipFor(query)).limit(query.limit),
    User.countDocuments(),
  ]);
  return { users, pagination: pageMeta(query, total) };
}

export async function getUser(id: string) {
  const user = await User.findById(id);
  if (!user) throw new AppError(404, 'User not found');
  return user;
}

export async function updateRole(actorId: string, id: string, role: Role) {
  assertNotSelf(actorId, id, 'change the role of');
  const user = await User.findByIdAndUpdate(id, { role }, { new: true, runValidators: true });
  if (!user) throw new AppError(404, 'User not found');
  return user;
}

export async function deleteUser(actorId: string, id: string) {
  assertNotSelf(actorId, id, 'delete');
  const user = await User.findByIdAndDelete(id);
  if (!user) throw new AppError(404, 'User not found');
  await deleteReviewsByUser(id);
}
