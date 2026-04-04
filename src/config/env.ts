import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  APP_PORT: z.coerce.number().int().positive(),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('1h'),
  ADMIN_EMAIL: z.string().email().default('admin@orbis.local'),
  ADMIN_PASSWORD: z.string().min(8).default('admin1234')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ');
  throw new Error(`invalid environment configuration: ${issues}`);
}

export const env = parsed.data;
