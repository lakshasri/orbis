import { Router } from 'express';
import { authService } from './auth.service';
import { requireAuth } from './auth.middleware';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const loginResult = await authService.login(req.body);
  if (!loginResult) {
    res.status(401).json({ error: 'invalid credentials' });
    return;
  }

  res.status(200).json(loginResult);
});

authRouter.get('/me', requireAuth, (req, res) => {
  const auth = req.auth;
  res.status(200).json({
    id: auth?.userId,
    email: auth?.email
  });
});
