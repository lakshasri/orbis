import express from 'express';
import { healthRouter } from './modules/health/health.routes';
import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { documentsRouter } from './modules/documents/documents.routes';

export const app = express();

app.use(express.json());

app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/documents', documentsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'not found' });
});
