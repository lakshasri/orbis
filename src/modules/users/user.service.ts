import { userRepository } from './user.repository';
import { hashPassword } from '../auth/password';

export const userService = {
  findByEmail(email: string) {
    return userRepository.findByEmail(email);
  },
  findById(id: number) {
    return userRepository.findById(id);
  },
  async createUser(email: string, password: string) {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return null;
    }

    const passwordHash = await hashPassword(password);
    return userRepository.create(email, passwordHash);
  },
  async assignRole(userId: number, roleName: string) {
    const role = await userRepository.findRoleByName(roleName);
    if (!role) {
      return null;
    }

    return userRepository.assignRole(userId, role.id);
  },
  getRoleNames(user: {
    roles: Array<{ role: { name: string } }>;
  }): string[] {
    return user.roles.map((entry) => entry.role.name);
  }
};
