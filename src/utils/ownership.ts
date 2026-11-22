import { Types } from 'mongoose';
import { AuthUser } from '../types/auth';
import { AppError } from './AppError';

export function assertOwnerOrAdmin(ownerId: Types.ObjectId, user: AuthUser): void {
  if (user.role !== 'admin' && ownerId.toString() !== user.id) {
    throw new AppError(403, 'You are not allowed to modify this resource');
  }
}
