import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IUserRepository } from '../../domain/repositories/IUserRepository';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, newPassword: string): Promise<void> {
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('La contraseña debe tener al menos 8 caracteres.');
    }
    const newHash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.changePassword(userId, newHash);
  }
}
