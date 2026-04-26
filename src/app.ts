import express, { type ErrorRequestHandler } from 'express';
import { healthRouter } from './modules/health/health.routes';
import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { documentsRouter } from './modules/documents/documents.routes';
import { auditsRouter } from './modules/audits/audits.routes';

export const app = express();

app.use(express.json());

app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/documents', documentsRouter);
app.use('/audits', auditsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'not found' });
});

const errorHandler: ErrorRequestHandler = (err, _req, res) => {
  // eslint-disable-next-line no-console
  console.error('error:', err);

  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'invalid json' });
    return;
  }

  res.status(500).json({ error: 'internal server error' });
};

app.use(errorHandler);
