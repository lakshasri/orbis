import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { app } from '../src/app';
import { hashPassword } from '../src/modules/auth/password';

const prisma = new PrismaClient();

type LoginResult = {
  token: string;
  userId: number;
};

async function login(email: string, password: string): Promise<LoginResult> {
  const response = await request(app).post('/auth/login').send({ email, password });
  return {
    token: response.body.accessToken,
    userId: response.body.user.id
  };
}

describe('audit and security integration', () => {
  beforeAll(
    async () => {
      await prisma.userRole.deleteMany();
      await prisma.document.deleteMany();
      await prisma.auditEvent.deleteMany();
      await prisma.user.deleteMany();
      await prisma.role.deleteMany();

      const adminRole = await prisma.role.create({ data: { name: 'ADMIN' } });
      const authorRole = await prisma.role.create({ data: { name: 'AUTHOR' } });
      const approverRole = await prisma.role.create({ data: { name: 'APPROVER' } });

      const admin = await prisma.user.create({
        data: {
          email: 'admin@orbis.local',
          passwordHash: await hashPassword('admin1234')
        }
      });

      const author = await prisma.user.create({
        data: {
          email: 'author@orbis.local',
          passwordHash: await hashPassword('author1234')
        }
      });

      const approver = await prisma.user.create({
        data: {
          email: 'approver@orbis.local',
          passwordHash: await hashPassword('approver1234')
        }
      });

      await prisma.userRole.createMany({
        data: [
          { userId: admin.id, roleId: adminRole.id },
          { userId: author.id, roleId: authorRole.id },
          { userId: approver.id, roleId: approverRole.id }
        ]
      });
    },
    15000
  );

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates audit events for login success', async () => {
    const beforeCount = await prisma.auditEvent.count();

    await request(app).post('/auth/login').send({
      email: 'author@orbis.local',
      password: 'author1234'
    });

    const afterCount = await prisma.auditEvent.count();
    expect(afterCount).toBe(beforeCount + 1);

    const lastEvent = await prisma.auditEvent.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    expect(lastEvent?.action).toBe('login_success');
    expect(lastEvent?.targetType).toBe('user_login');
  });

  it('creates audit events for user creation', async () => {
    const adminLogin = await login('admin@orbis.local', 'admin1234');
    const beforeCount = await prisma.auditEvent.count();

    await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${adminLogin.token}`)
      .send({ email: 'newaudit@orbis.local', password: 'newpass123' });

    const afterCount = await prisma.auditEvent.count();
    expect(afterCount).toBe(beforeCount + 1);

    const lastEvent = await prisma.auditEvent.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    expect(lastEvent?.action).toBe('user_created');
    expect(lastEvent?.targetType).toBe('user');
  });

  it('creates audit events for document actions', async () => {
    const authorLogin = await login('author@orbis.local', 'author1234');
    const approverLogin = await login('approver@orbis.local', 'approver1234');

    const createResponse = await request(app)
      .post('/documents')
      .set('Authorization', `Bearer ${authorLogin.token}`)
      .send({ title: 'audit test', content: 'test content' });

    const documentId = createResponse.body.id as number;

    const eventCountBeforeSubmit = await prisma.auditEvent.count({
      where: { targetId: documentId }
    });

    await request(app)
      .post(`/documents/${documentId}/submit`)
      .set('Authorization', `Bearer ${authorLogin.token}`)
      .send();

    const eventCountAfterSubmit = await prisma.auditEvent.count({
      where: { targetId: documentId }
    });

    expect(eventCountAfterSubmit).toBe(eventCountBeforeSubmit + 1);

    await request(app)
      .post(`/documents/${documentId}/approve`)
      .set('Authorization', `Bearer ${approverLogin.token}`)
      .send();

    const eventCountAfterApprove = await prisma.auditEvent.count({
      where: { targetId: documentId }
    });

    expect(eventCountAfterApprove).toBe(eventCountAfterSubmit + 1);
  });

  it('returns clean validation errors for invalid payloads', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'invalid-email', password: '' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it('allows authorized users to read audit history', async () => {
    const authorLogin = await login('author@orbis.local', 'author1234');
    const approverLogin = await login('approver@orbis.local', 'approver1234');

    const createResponse = await request(app)
      .post('/documents')
      .set('Authorization', `Bearer ${authorLogin.token}`)
      .send({ title: 'history test', content: 'test' });

    const documentId = createResponse.body.id as number;

    const historyResponse = await request(app)
      .get(`/audits/documents/${documentId}/history`)
      .set('Authorization', `Bearer ${authorLogin.token}`);

    expect(historyResponse.status).toBe(200);
    expect(Array.isArray(historyResponse.body)).toBe(true);

    const allAuditsWithApprover = await request(app)
      .get('/audits')
      .set('Authorization', `Bearer ${approverLogin.token}`);

    expect(allAuditsWithApprover.status).toBe(200);
  });

  it('blocks non-admin from reading all audits', async () => {
    const authorLogin = await login('author@orbis.local', 'author1234');

    const response = await request(app)
      .get('/audits')
      .set('Authorization', `Bearer ${authorLogin.token}`);

    expect(response.status).toBe(403);
  });

  it('ensures audit events are not mutable', async () => {
    const adminLogin = await login('admin@orbis.local', 'admin1234');

    const deleteResponse = await request(app)
      .delete('/audits/1')
      .set('Authorization', `Bearer ${adminLogin.token}`);

    expect([404, 405]).toContain(deleteResponse.status);

    const updateResponse = await request(app)
      .put('/audits/1')
      .set('Authorization', `Bearer ${adminLogin.token}`)
      .send({ action: 'modified' });

    expect([404, 405]).toContain(updateResponse.status);
  });

  it('throttles login endpoint under repeated attempts', async () => {
    const requests = [];

    for (let i = 0; i < 7; i++) {
      requests.push(
        request(app).post('/auth/login').send({
          email: 'throttle.test@orbis.local',
          password: 'wrongpassword'
        })
      );
    }

    const responses = await Promise.all(requests);

    const blockedResponses = responses.filter((r) => r.status === 429);
    expect(blockedResponses.length).toBeGreaterThan(0);
  });
});
