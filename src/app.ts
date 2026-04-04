import express from 'express';
import { healthRouter } from './modules/health/health.routes';
import { authRouter } from './modules/auth/auth.routes';

export const app = express();

app.use(express.json());

app.use('/health', healthRouter);
app.use('/auth', authRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'not found' });
});
