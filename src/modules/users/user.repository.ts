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
  }
};
