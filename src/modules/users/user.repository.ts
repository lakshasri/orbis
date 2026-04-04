import { prisma } from '../../config/db';

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } }
    });
  },
  findById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } }
    });
  },
  create(email: string, passwordHash: string) {
    return prisma.user.create({
      data: {
        email,
        passwordHash
      },
      include: { roles: { include: { role: true } } }
    });
  },
  findRoleByName(roleName: string) {
    return prisma.role.findUnique({ where: { name: roleName } });
  },
  async assignRole(userId: number, roleId: number) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId
        }
      },
      update: {},
      create: {
        userId,
        roleId
      }
    });

    return prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } }
    });
  }
};
