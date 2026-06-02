import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from './jwt';
import { userService } from '../users/user.service';

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const payload = verifyAccessToken(token);
    const user = await userService.findById(payload.sub);
    if (!user) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    req.auth = {
      userId: payload.sub,
      email: payload.email,
      roles: userService.getRoleNames(user)
    };
    next();
  } catch {
    res.status(401).json({ error: 'unauthorized' });
  }
}
