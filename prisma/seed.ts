import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/modules/auth/password';
import { env } from '../src/config/env';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const roleNames = ['ADMIN', 'AUTHOR', 'APPROVER'] as const;

  for (const roleName of roleNames) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName }
    });
  }

  const adminPasswordHash = await hashPassword(env.ADMIN_PASSWORD);

  const adminUser = await prisma.user.upsert({
    where: { email: env.ADMIN_EMAIL },
    update: { passwordHash: adminPasswordHash },
    create: {
      email: env.ADMIN_EMAIL,
      passwordHash: adminPasswordHash
    }
  });

  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  if (!adminRole) {
    throw new Error('admin role was not created');
  }

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id
      }
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id
    }
  });

  // eslint-disable-next-line no-console
  console.log('seed complete');
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
