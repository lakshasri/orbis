import { userRepository } from './user.repository';

export const userService = {
  findByEmail(email: string) {
    return userRepository.findByEmail(email);
  },
  findById(id: number) {
    return userRepository.findById(id);
  }
};
