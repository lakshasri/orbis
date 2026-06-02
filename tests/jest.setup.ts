import { execSync } from 'node:child_process';

process.env.APP_PORT = '3000';
process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-secret-value-123';
process.env.JWT_EXPIRES_IN = '1h';
process.env.ADMIN_EMAIL = 'admin@orbis.local';
process.env.ADMIN_PASSWORD = 'admin1234';

execSync('npx prisma migrate deploy', {
	stdio: 'ignore',
	env: {
		...process.env,
		DATABASE_URL: process.env.DATABASE_URL
	}
});
