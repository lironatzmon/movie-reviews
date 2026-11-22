import { RequestHandler } from 'express';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { verifyToken } from '../utils/jwt';
import { Role } from '../types/auth';

const BEARER = 'Bearer ';

export const authenticate: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith(BEARER)) {
    return next(new AppError(401, 'Authentication required'));
  }

  let userId: string;
  try {
    userId = verifyToken(header.slice(BEARER.length)).id;
  } catch {
    return next(new AppError(401, 'Invalid or expired token'));
  }

  // Load the user on every request so deleted users and role changes take effect immediately.
  const user = await User.findById(userId, 'role');
  if (!user) return next(new AppError(401, 'User no longer exists'));

  req.user = { id: userId, role: user.role };
  next();
};

export const authorize =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(new AppError(401, 'Authentication required'));
    if (!roles.includes(req.user.role)) return next(new AppError(403, 'Forbidden'));
    next();
  };
