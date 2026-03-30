/**
 * RegisterUseCase
 * Capa de aplicación - Registrar nuevo estudiante
 * 1. Verificar que el email no exista
 * 2. Hashear contraseña con bcrypt
 * 3. Crear usuario
 * 4. Generar código de verificación
 * 5. Retornar respuesta
 */

import { IUseCase } from '@shared/types';
import { RegisterDTO, RegisterResponseDTO } from '../dtos/RegisterDTO';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { User } from '../../domain/entities/User';
import { ConflictError } from '@shared/errors/AppError';
import { PasswordService } from '@shared/services';
import { DatabaseConnection } from '@config/database';

export class RegisterUseCase implements IUseCase<RegisterDTO, RegisterResponseDTO> {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: RegisterDTO): Promise<RegisterResponseDTO> {
    // 1. Verificar que no exista el email
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictError('A user with this email already exists');
    }

    // 2. Hashear contraseña
    const hashedPassword = await PasswordService.hash(input.password);

    // 3. Crear usuario
    const user = new User(
      input.email,
      input.name,
      hashedPassword,
      'STUDENT',
      false, // no verificado inicialmente
      5.0,
    );

    const createdUser = await this.userRepository.create(user);

    // 4. Generar código de verificación (6 dígitos)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    const pool = DatabaseConnection.getInstance();
    await pool.query(
      `INSERT INTO verification_codes (user_id, code, type, expires_at) VALUES ($1, $2, 'EMAIL', $3)`,
      [createdUser.id, verificationCode, expiresAt],
    );

    // 5. Retornar (en desarrollo se incluye el código)
    return new RegisterResponseDTO(
      createdUser.id,
      createdUser.email,
      createdUser.name,
      process.env.NODE_ENV === 'development' ? verificationCode : undefined,
    );
  }
}
