import { IUseCase } from '@shared/types';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { DatabaseConnection } from '@config/database';
import { PasswordService } from '@shared/services';
import { ValidationError, NotFoundError } from '@shared/errors/AppError';

interface ResetPasswordInput {
  email: string;
  code: string;
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
        codigo character varying(6) NOT NULL,
        expira_en timestamp without time zone NOT NULL,
        intentos_fallidos integer NOT NULL DEFAULT 0,
        bloqueado_hasta timestamp without time zone,
        creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
        actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  private static isStrongPassword(password: string): boolean {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
  }

  async execute(input: ResetPasswordInput): Promise<ResetPasswordOutput> {
    await this.ensurePasswordResetTable();

    const normalizedEmail = input.email.trim().toLowerCase();
    const code = input.code.trim();
    const newPassword = input.newPassword;

    if (!normalizedEmail) {
      throw new ValidationError('El correo es obligatorio');
    }

    if (!code) {
      throw new ValidationError('El código de verificación es obligatorio');
    }

    if (!ResetPasswordUseCase.isStrongPassword(newPassword)) {
      throw new ValidationError('La contraseña debe tener al menos 8 caracteres e incluir mayúscula, minúscula y número');
    }

    const pool = DatabaseConnection.getInstance();

    // Buscar el registro de recuperación
    const result = await pool.query(
      `SELECT correo, codigo, expira_en, intentos_fallidos, bloqueado_hasta
       FROM recuperaciones_contrasena
       WHERE correo = $1
       LIMIT 1`,
      [normalizedEmail],
    );

    if (result.rows.length === 0) {
      throw new ValidationError('No se encontró solicitud de recuperación para este correo');
    }

    const record = result.rows[0];

    // Verificar si está bloqueado por intentos fallidos
    if (record.bloqueado_hasta) {
      const now = new Date();
      const bloqueadoHasta = new Date(record.bloqueado_hasta);
      if (bloqueadoHasta > now) {
        const minutosRestantes = Math.ceil((bloqueadoHasta.getTime() - now.getTime()) / 60000);
        throw new ValidationError(`Demasiados intentos fallidos. Intenta en ${minutosRestantes} minutos`);
      }
    }

    // Verificar expiración
    if (new Date(record.expira_en) <= new Date()) {
      await pool.query(
        `DELETE FROM recuperaciones_contrasena WHERE correo = $1`,
        [normalizedEmail],
      );
      throw new ValidationError('El código de verificación ha expirado. Solicita uno nuevo');
    }

    // Verificar código
    if (record.codigo.trim() !== code) {
      const nuevoIntento = record.intentos_fallidos + 1;
      let bloqueadoHasta = null;

      // Bloquear después de 3 intentos fallidos
      if (nuevoIntento >= 3) {
        bloqueadoHasta = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
      }

      await pool.query(
        `UPDATE recuperaciones_contrasena
         SET intentos_fallidos = $1, bloqueado_hasta = $2, actualizado_en = NOW()
         WHERE correo = $3`,
        [nuevoIntento, bloqueadoHasta, normalizedEmail],
      );

      const intentosRestantes = 3 - nuevoIntento;
      if (intentosRestantes > 0) {
        throw new ValidationError(`Código inválido. ${intentosRestantes} intento(s) restante(s)`);
      } else {
        throw new ValidationError('Demasiados intentos fallidos. Intenta en 15 minutos');
      }
    }

    // Código correcto - buscar usuario
    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Cambiar contraseña
    const hashedPassword = await PasswordService.hash(newPassword);
    await this.userRepository.update(user.id, { hashedPassword } as any);

    // Eliminar registro de recuperación
    await pool.query(
      `DELETE FROM recuperaciones_contrasena WHERE correo = $1`,
      [normalizedEmail],
    );

    return {
      message: 'Contraseña actualizada exitosamente',
      reset: true,
    };
  }
}
