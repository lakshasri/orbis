import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from './jwt';

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const payload = verifyAccessToken(token);
    req.auth = {
      userId: payload.sub,
      email: payload.email
    };
    next();
  } catch {
    res.status(401).json({ error: 'unauthorized' });
  }
}
