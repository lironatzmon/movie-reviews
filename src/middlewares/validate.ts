import { RequestHandler } from 'express';
import { ZodType } from 'zod';
import { AppError } from '../utils/AppError';

type RequestPart = 'body' | 'params' | 'query';
type Schemas = Partial<Record<RequestPart, ZodType>>;

export const validate =
  (schemas: Schemas): RequestHandler =>
  (req, _res, next) => {
    const details: { location: RequestPart; path: string; message: string }[] = [];

    for (const [location, schema] of Object.entries(schemas) as [RequestPart, ZodType][]) {
      const result = schema.safeParse(req[location]);
      if (!result.success) {
        result.error.issues.forEach((issue) =>
          details.push({ location, path: issue.path.join('.'), message: issue.message }),
        );
        continue;
      }
      // req.query is a read-only getter in Express 5, so we redefine it on the instance.
      Object.defineProperty(req, location, { value: result.data, writable: true });
    }

    if (details.length) return next(new AppError(400, 'Validation failed', details));
    next();
  };
