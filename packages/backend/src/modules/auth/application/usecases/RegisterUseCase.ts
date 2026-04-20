/**
 * RegisterUseCase
 * Capa de aplicación - Registrar nuevo estudiante
 */

import { IUseCase } from '@shared/types';
import { RegisterDTO, RegisterResponseDTO } from '../dtos/RegisterDTO';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { User } from '../../domain/entities/User';
import { ConflictError } from '@shared/errors/AppError';
import { PasswordService } from '@shared/services';
import { DatabaseConnection } from '@config/database';
import { EmailService } from '@shared/services/EmailService';

export class RegisterUseCase implements IUseCase<RegisterDTO, RegisterResponseDTO> {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: RegisterDTO): Promise<RegisterResponseDTO> {
    // 1. Validar correo institucional
    const emailRegex = /^[a-zA-Z0-9._%+-]+@uta\.edu\.ec$/;
    if (!emailRegex.test(input.email)) {
      throw new ConflictError('Solo se permiten correos institucionales @uta.edu.ec');
    }

    // 2. Verificar que no exista
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictError('A user with this email already exists');
    }

    // 3. Hashear contraseña
    const hashedPassword = await PasswordService.hash(input.password);

    // 4. Crear usuario
    const user = new User(
      input.email,
      input.name,
      hashedPassword,
      'STUDENT',
      false,
      5.0,
    );

    const createdUser = await this.userRepository.create(user);

    // 5. Generar código
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // 6. Guardar en BD
    const pool = DatabaseConnection.getInstance();
    await pool.query(
      `INSERT INTO codigos_verificacion (usuario_id, codigo, tipo, expira_en)
       VALUES ($1, $2, 'EMAIL', $3)`,
      [createdUser.id, verificationCode, expiresAt],
    );

    // 7. ENVIAR CORREO
    await EmailService.sendVerificationEmail(input.email, verificationCode);

    // 8. Retornar
    return new RegisterResponseDTO(
      createdUser.id,
      createdUser.email,
      createdUser.name,
      //process.env.NODE_ENV === 'development' ? verificationCode : undefined,
    );
  }
}