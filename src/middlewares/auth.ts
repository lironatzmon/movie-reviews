import { RequestHandler } from 'express';
import { AppError } from '../utils/AppError';
import { verifyToken } from '../utils/jwt';
import { Role } from '../types/auth';

const BEARER = 'Bearer ';

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith(BEARER)) {
    return next(new AppError(401, 'Authentication required'));
  }

  try {
    req.user = verifyToken(header.slice(BEARER.length));
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token'));
  }
};

export const authorize =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(new AppError(401, 'Authentication required'));
    if (!roles.includes(req.user.role)) return next(new AppError(403, 'Forbidden'));
    next();
  };
