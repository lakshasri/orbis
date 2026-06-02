import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { app } from '../src/app';
import { hashPassword } from '../src/modules/auth/password';

const prisma = new PrismaClient();

describe('auth integration', () => {
  beforeAll(
    async () => {
    await prisma.userRole.deleteMany();
    await prisma.role.deleteMany();
    await prisma.document.deleteMany();
    await prisma.auditEvent.deleteMany();
    await prisma.user.deleteMany();

    const role = await prisma.role.create({ data: { name: 'AUTHOR' } });
    const user = await prisma.user.create({
      data: {
        email: 'user@orbis.local',
        passwordHash: await hashPassword('secret123')
      }
    });

    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id
      }
    });
  },
  15000
  );

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('returns token for valid credentials', async () => {
    const response = await request(app).post('/auth/login').send({
      email: 'user@orbis.local',
      password: 'secret123'
    });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
  });

  it('returns 401 for invalid credentials', async () => {
    const response = await request(app).post('/auth/login').send({
      email: 'user@orbis.local',
      password: 'wrong-password'
    });

    expect(response.status).toBe(401);
  });

  it('rejects protected route without token', async () => {
    const response = await request(app).get('/auth/me');

    expect(response.status).toBe(401);
  });

  it('rejects protected route with invalid token', async () => {
    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
  });
});
