import type { NextFunction, Request, Response } from 'express';

export function requireRoles(...requiredRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth?.userId) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    const roleNames = req.auth.roles ?? [];

    const hasRole = requiredRoles.some((role) => roleNames.includes(role));
    if (!hasRole) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    next();
  };
}
