import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authService } from './auth.service';
import { requireAuth } from './auth.middleware';
import { auditService } from '../audits/audit.service';

export const authRouter = Router();

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'too many login attempts'
});

authRouter.post('/login', loginLimiter, async (req, res) => {
  try {
    const loginResult = await authService.login(req.body);
    if (!loginResult) {
      const email = req.body?.email;
      if (email) {
        await auditService.log(null, 'login_failed', 'user_login', null);
      }

      res.status(401).json({ error: 'invalid credentials' });
      return;
    }

    await auditService.log(loginResult.user.id, 'login_success', 'user_login', null);

    res.status(200).json(loginResult);
  } catch (error) {
    res.status(400).json({ error: 'invalid payload' });
  }
});

authRouter.get('/me', requireAuth, (req, res) => {
  const auth = req.auth;
  res.status(200).json({
    id: auth?.userId,
    email: auth?.email
  });
});
