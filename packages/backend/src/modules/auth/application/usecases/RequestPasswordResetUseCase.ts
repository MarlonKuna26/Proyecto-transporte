import crypto from 'crypto';
import { IUseCase } from '@shared/types';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { DatabaseConnection } from '@config/database';
import { EmailService } from '@shared/services/EmailService';

interface RequestPasswordResetInput {
  email: string;
}

interface RequestPasswordResetOutput {
  requested: boolean;
  expiresInMinutes: number;
  code?: string; // Solo en dev mode
}

export class RequestPasswordResetUseCase implements IUseCase<RequestPasswordResetInput, RequestPasswordResetOutput> {
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

  private static isDevMode(): boolean {
    return process.env.EMAIL_DEV_MODE === 'true';
  }

  private static generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async execute(input: RequestPasswordResetInput): Promise<RequestPasswordResetOutput> {
    await this.ensurePasswordResetTable();

    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(normalizedEmail);

    const expiresInMinutes = 15;

    if (!user) {
      return { requested: true, expiresInMinutes };
    }

    const resetCode = RequestPasswordResetUseCase.generateCode();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    const pool = DatabaseConnection.getInstance();
    await pool.query(
      `INSERT INTO recuperaciones_contrasena (
         correo, codigo, expira_en, intentos_fallidos, actualizado_en
       ) VALUES ($1, $2, $3, 0, NOW())
       ON CONFLICT (correo)
       DO UPDATE SET
         codigo = EXCLUDED.codigo,
         expira_en = EXCLUDED.expira_en,
         intentos_fallidos = 0,
         bloqueado_hasta = NULL,
         actualizado_en = NOW()`,
      [normalizedEmail, resetCode, expiresAt],
    );

    await EmailService.sendPasswordResetCode(normalizedEmail, resetCode);

    const output: RequestPasswordResetOutput = {
      requested: true,
      expiresInMinutes,
    };

    if (RequestPasswordResetUseCase.isDevMode()) {
      output.code = resetCode;
    }

    return output;
  }
}
