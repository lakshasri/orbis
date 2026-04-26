import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth/auth.middleware';
import { requireRoles } from '../auth/authorization.middleware';
import { userService } from './user.service';
import { auditService } from '../audits/audit.service';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const assignRoleSchema = z.object({
  role: z.enum(['ADMIN', 'AUTHOR', 'APPROVER'])
});

export const usersRouter = Router();

usersRouter.post('/', requireAuth, requireRoles('ADMIN'), async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid payload' });
    return;
  }

  const user = await userService.createUser(parsed.data.email, parsed.data.password);
  if (!user) {
    res.status(409).json({ error: 'user already exists' });
    return;
  }

  await auditService.log(req.auth?.userId ?? null, 'user_created', 'user', user.id);

  res.status(201).json({
    id: user.id,
    email: user.email,
    roles: userService.getRoleNames(user)
  });
});

usersRouter.post(
  '/:id/roles',
  requireAuth,
  requireRoles('ADMIN'),
  async (req, res) => {
    const userId = Number(req.params.id);
    if (Number.isNaN(userId)) {
      res.status(400).json({ error: 'invalid user id' });
      return;
    }

    const parsed = assignRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid payload' });
      return;
    }

    const updatedUser = await userService.assignRole(userId, parsed.data.role);
    if (!updatedUser) {
      res.status(404).json({ error: 'user or role not found' });
      return;
    }

    await auditService.log(req.auth?.userId ?? null, 'role_assigned', 'user_role', userId);

    res.status(200).json({
      id: updatedUser.id,
      email: updatedUser.email,
      roles: userService.getRoleNames(updatedUser)
    });
  }
);
