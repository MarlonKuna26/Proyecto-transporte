/**
 * RegisterUseCase
 * Capa de aplicación - Registrar nuevo estudiante
 */

import { IUseCase } from '@shared/types';
import { RegisterDTO, RegisterResponseDTO } from '../dtos/RegisterDTO';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { ConflictError } from '@shared/errors/AppError';
import { PasswordService } from '@shared/services';
import { DatabaseConnection } from '@config/database';
import { EmailService } from '@shared/services/EmailService';

export class RegisterUseCase implements IUseCase<RegisterDTO, RegisterResponseDTO> {
  constructor(private userRepository: IUserRepository) {}

  private async ensurePendingRegistrationsTable(): Promise<void> {
    const pool = DatabaseConnection.getInstance();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS registros_pendientes_verificacion (
        correo character varying(255) PRIMARY KEY,
        nombre character varying(255) NOT NULL,
        contrasena_hash character varying(255) NOT NULL,
        codigo character varying(6) NOT NULL,
        expira_en timestamp without time zone NOT NULL,
        creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
        actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  async execute(input: RegisterDTO): Promise<RegisterResponseDTO> {
    await this.ensurePendingRegistrationsTable();

    // 1. Validar correo institucional
    const normalizedEmail = input.email.trim().toLowerCase();
    const emailRegex = /^[a-z0-9._%+-]+@uta\.edu\.ec$/;
    if (!emailRegex.test(normalizedEmail)) {
      throw new ConflictError('Solo se permiten correos institucionales @uta.edu.ec');
    }

    // 2. Verificar que no exista
    const existingUser = await this.userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictError('A user with this email already exists');
    }

    // 3. Hashear contraseña
    const hashedPassword = await PasswordService.hash(input.password);

    // 4. Generar código
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // 5. Guardar pre-registro (sin crear usuario aún)
    const pool = DatabaseConnection.getInstance();
    await pool.query(
      `INSERT INTO registros_pendientes_verificacion (
         correo, nombre, contrasena_hash, codigo, expira_en, actualizado_en
       )
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (correo)
       DO UPDATE SET
         nombre = EXCLUDED.nombre,
         contrasena_hash = EXCLUDED.contrasena_hash,
         codigo = EXCLUDED.codigo,
         expira_en = EXCLUDED.expira_en,
         actualizado_en = NOW()`,
      [normalizedEmail, input.name, hashedPassword, verificationCode, expiresAt],
    );

    // 6. ENVIAR CORREO
    await EmailService.sendVerificationEmail(normalizedEmail, verificationCode);

    // 7. Retornar
    return new RegisterResponseDTO(
      normalizedEmail,
      input.name,
      30,
      true,
      //process.env.NODE_ENV === 'development' ? verificationCode : undefined,
    );
  }
}