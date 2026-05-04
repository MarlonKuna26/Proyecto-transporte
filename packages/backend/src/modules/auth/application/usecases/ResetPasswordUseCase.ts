import crypto from 'crypto';
import { IUseCase } from '@shared/types';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { DatabaseConnection } from '@config/database';
import { PasswordService } from '@shared/services';
import { ValidationError, NotFoundError } from '@shared/errors/AppError';

interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

interface ResetPasswordOutput {
  message: string;
  reset: boolean;
}

export class ResetPasswordUseCase implements IUseCase<ResetPasswordInput, ResetPasswordOutput> {
  constructor(private userRepository: IUserRepository) {}

  private async ensurePasswordResetTable(): Promise<void> {
    const pool = DatabaseConnection.getInstance();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS recuperaciones_contrasena (
        correo character varying(255) PRIMARY KEY,
        token_hash character varying(255) NOT NULL,
        expira_en timestamp without time zone NOT NULL,
        usado boolean NOT NULL DEFAULT false,
        creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
        actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  private static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private static isStrongPassword(password: string): boolean {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
  }

  async execute(input: ResetPasswordInput): Promise<ResetPasswordOutput> {
    await this.ensurePasswordResetTable();

    const token = input.token.trim();
    const newPassword = input.newPassword;

    if (!token) {
      throw new ValidationError('El token de recuperación es obligatorio');
    }

    if (!ResetPasswordUseCase.isStrongPassword(newPassword)) {
      throw new ValidationError('La contraseña debe tener al menos 8 caracteres e incluir mayúscula, minúscula y número');
    }

    const tokenHash = ResetPasswordUseCase.hashToken(token);
    const pool = DatabaseConnection.getInstance();

    const result = await pool.query(
      `SELECT correo, expira_en, usado
       FROM recuperaciones_contrasena
       WHERE token_hash = $1
       LIMIT 1`,
      [tokenHash],
    );

    if (result.rows.length === 0) {
      throw new ValidationError('Token inválido o expirado');
    }

    const record = result.rows[0];

    if (record.usado) {
      throw new ValidationError('Este enlace ya fue utilizado');
    }

    if (new Date(record.expira_en) <= new Date()) {
      await pool.query(
        `DELETE FROM recuperaciones_contrasena WHERE token_hash = $1`,
        [tokenHash],
      );
      throw new ValidationError('Token inválido o expirado');
    }

    const user = await this.userRepository.findByEmail(record.correo);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    const hashedPassword = await PasswordService.hash(newPassword);
    await this.userRepository.update(user.id, { hashedPassword } as any);

    await pool.query(
      `UPDATE recuperaciones_contrasena
       SET usado = true, actualizado_en = NOW()
       WHERE token_hash = $1`,
      [tokenHash],
    );

    return { message: 'Contraseña actualizada correctamente', reset: true };
  }
}
