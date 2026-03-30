/**
 * VerifyEmailUseCase
 * Verifica el código de email y activa la cuenta
 */

import { IUseCase } from '@shared/types';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { ValidationError, NotFoundError } from '@shared/errors/AppError';
import { DatabaseConnection } from '@config/database';

interface VerifyEmailInput {
  email: string;
  code: string;
}

interface VerifyEmailOutput {
  message: string;
  verified: boolean;
}

export class VerifyEmailUseCase implements IUseCase<VerifyEmailInput, VerifyEmailOutput> {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: VerifyEmailInput): Promise<VerifyEmailOutput> {
    const pool = DatabaseConnection.getInstance();

    // 1. Buscar usuario por email
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.isVerified) {
      return { message: 'Email is already verified', verified: true };
    }

    // 2. Verificar código
    const result = await pool.query(
      `SELECT * FROM verification_codes 
       WHERE user_id = $1 AND code = $2 AND type = 'EMAIL' AND used = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [user.id, input.code],
    );

    if (result.rows.length === 0) {
      throw new ValidationError('Invalid or expired verification code');
    }

    // 3. Marcar código como usado
    await pool.query(
      `UPDATE verification_codes SET used = true WHERE id = $1`,
      [result.rows[0].id],
    );

    // 4. Verificar usuario
    await this.userRepository.update(user.id, { isVerified: true } as any);

    // 5. Crear perfil vacío para el usuario
    await pool.query(
      `INSERT INTO user_profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
      [user.id],
    );

    return { message: 'Email verified successfully', verified: true };
  }
}
