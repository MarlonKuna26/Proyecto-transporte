/**
 * VerifyEmailUseCase
 * Verifica el código de email y activa la cuenta
 */

import { IUseCase } from '@shared/types';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { ValidationError, NotFoundError } from '@shared/errors/AppError';
import { DatabaseConnection } from '@config/database';
import { User } from '../../domain/entities/User';

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

  async execute(input: VerifyEmailInput): Promise<VerifyEmailOutput> {
    const pool = DatabaseConnection.getInstance();
    await this.ensurePendingRegistrationsTable();

    const normalizedEmail = input.email.trim().toLowerCase();
    const normalizedCode = input.code.trim();

    // 1. Verificar si ya existe usuario y está verificado
    const existingUser = await this.userRepository.findByEmail(normalizedEmail);
    if (existingUser?.isVerified) {
      return { message: 'Email is already verified', verified: true };
    }

    // 2. Buscar registro pendiente SOLO por email
    const pendingResult = await pool.query(
      `SELECT correo, nombre, contrasena_hash, codigo, expira_en
       FROM registros_pendientes_verificacion
       WHERE correo = $1
       LIMIT 1`,
      [normalizedEmail],
    );

    if (pendingResult.rows.length === 0) {
      if (existingUser) {
        throw new ValidationError('Invalid or expired verification code');
      }
      throw new NotFoundError('No pending registration found for this email');
    }

    const pending = pendingResult.rows[0];

    // 3. Validar código (separado)
    if (pending.codigo.trim() !== normalizedCode) {
      throw new ValidationError('Invalid verification code');
    }

    // 4. Validar expiración (separado)
    const now = new Date();
    const expiration = new Date(pending.expira_en);

    if (expiration <= now) {
      await pool.query(
        `DELETE FROM registros_pendientes_verificacion WHERE correo = $1`,
        [normalizedEmail],
      );
      throw new ValidationError('Verification code expired. Please register again');
    }

    // 5. Crear o actualizar usuario
    let user = existingUser;

    if (!user) {
      const newUser = new User(
        pending.correo,
        pending.nombre,
        pending.contrasena_hash,
        'STUDENT',
        true,
        5.0,
      );

      user = await this.userRepository.create(newUser);
    } else if (!user.isVerified) {
      user = await this.userRepository.update(user.id, { isVerified: true } as any);
    }

    // 6. Crear perfil si no existe
    await pool.query(
      `INSERT INTO perfiles_usuario (usuario_id) 
       VALUES ($1) 
       ON CONFLICT (usuario_id) DO NOTHING`,
      [user.id],
    );

    // 7. Eliminar registro pendiente
    await pool.query(
      `DELETE FROM registros_pendientes_verificacion WHERE correo = $1`,
      [normalizedEmail],
    );

    return {
      message: 'Email verified successfully',
      verified: true,
    };
  }
}