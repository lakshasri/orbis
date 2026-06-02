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

describe('rbac and workflow integration', () => {
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

  it('allows admin to create users and assign roles', async () => {
    const adminLogin = await login('admin@orbis.local', 'admin1234');

    const createUserResponse = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${adminLogin.token}`)
      .send({ email: 'new.user@orbis.local', password: 'newuser123' });

    expect(createUserResponse.status).toBe(201);
    expect(createUserResponse.body.email).toBe('new.user@orbis.local');

    const assignRoleResponse = await request(app)
      .post(`/users/${createUserResponse.body.id}/roles`)
      .set('Authorization', `Bearer ${adminLogin.token}`)
      .send({ role: 'AUTHOR' });

    expect(assignRoleResponse.status).toBe(200);
    expect(assignRoleResponse.body.roles).toContain('AUTHOR');
  });

  it('blocks non-admin users from admin routes', async () => {
    const authorLogin = await login('author@orbis.local', 'author1234');

    const response = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${authorLogin.token}`)
      .send({ email: 'should.fail@orbis.local', password: 'user12345' });

    expect(response.status).toBe(403);
  });

  it('allows only valid transitions and role-authorized actions', async () => {
    const authorLogin = await login('author@orbis.local', 'author1234');
    const approverLogin = await login('approver@orbis.local', 'approver1234');

    const createDocumentResponse = await request(app)
      .post('/documents')
      .set('Authorization', `Bearer ${authorLogin.token}`)
      .send({ title: 'contract', content: 'contract content' });

    expect(createDocumentResponse.status).toBe(201);
    expect(createDocumentResponse.body.state).toBe('DRAFT');

    const documentId = createDocumentResponse.body.id as number;

    const unauthorizedApprove = await request(app)
      .post(`/documents/${documentId}/approve`)
      .set('Authorization', `Bearer ${authorLogin.token}`)
      .send();

    expect(unauthorizedApprove.status).toBe(403);

    const submitResponse = await request(app)
      .post(`/documents/${documentId}/submit`)
      .set('Authorization', `Bearer ${authorLogin.token}`)
      .send();

    expect(submitResponse.status).toBe(200);
    expect(submitResponse.body.state).toBe('SUBMITTED');

    const invalidResubmit = await request(app)
      .post(`/documents/${documentId}/submit`)
      .set('Authorization', `Bearer ${authorLogin.token}`)
      .send();

    expect(invalidResubmit.status).toBe(403);

    const approveResponse = await request(app)
      .post(`/documents/${documentId}/approve`)
      .set('Authorization', `Bearer ${approverLogin.token}`)
      .send();

    expect(approveResponse.status).toBe(200);
    expect(approveResponse.body.state).toBe('APPROVED');

    const invalidRejectAfterApprove = await request(app)
      .post(`/documents/${documentId}/reject`)
      .set('Authorization', `Bearer ${approverLogin.token}`)
      .send();

    expect(invalidRejectAfterApprove.status).toBe(403);
  });
});
