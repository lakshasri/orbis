import { z } from 'zod';
import { userService } from '../users/user.service';
import { createAccessToken } from './jwt';
import { verifyPassword } from './password';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const authService = {
  async login(input: unknown) {
    const { email, password } = loginSchema.parse(input);

    const user = await userService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return null;
    }

    const token = createAccessToken({
      sub: user.id,
      email: user.email
    });

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles.map((entry) => entry.role.name)
      }
    };
  }
};
