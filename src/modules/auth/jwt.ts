import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export type AuthTokenPayload = {
  sub: number;
  email: string;
};

export function createAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']
  });
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === 'string') {
    throw new Error('invalid token payload');
  }

  return {
    sub: Number(decoded.sub),
    email: String(decoded.email)
  };
}
