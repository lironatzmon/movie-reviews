import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthUser } from '../types/auth';

export function signToken({ id, role }: AuthUser): string {
  return jwt.sign({ id, role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): AuthUser {
  const { id, role } = jwt.verify(token, env.jwtSecret) as AuthUser;
  return { id, role };
}
