import { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../utils/AppError';

const DUPLICATE_KEY = 11000;

function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (error instanceof mongoose.Error.ValidationError) {
    const details = Object.values(error.errors).map(({ path, message }) => ({ path, message }));
    return new AppError(400, 'Validation failed', details);
  }
  if (error instanceof mongoose.Error.CastError) {
    return new AppError(400, `Invalid ${error.path}`);
  }
  if ((error as { code?: number }).code === DUPLICATE_KEY) {
    return new AppError(409, 'Resource already exists');
  }
  if ((error as { type?: string }).type === 'entity.parse.failed') {
    return new AppError(400, 'Malformed JSON body');
  }

  console.error(error);
  return new AppError(500, 'Internal server error');
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const { statusCode, message, details } = toAppError(error);
  res.status(statusCode).json({ error: details ? { message, details } : { message } });
};

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(404, `Route ${req.method} ${req.originalUrl} not found`));
};
