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
  resetUrl?: string;
  resetToken?: string;
}

export class RequestPasswordResetUseCase implements IUseCase<RequestPasswordResetInput, RequestPasswordResetOutput> {
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

  private static isDevMode(): boolean {
    return process.env.EMAIL_DEV_MODE === 'true';
  }

  private static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async execute(input: RequestPasswordResetInput): Promise<RequestPasswordResetOutput> {
    await this.ensurePasswordResetTable();

    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(normalizedEmail);

    const expiresInMinutes = 30;

    if (!user) {
      return { requested: true, expiresInMinutes };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = RequestPasswordResetUseCase.hashToken(resetToken);
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    const pool = DatabaseConnection.getInstance();
    await pool.query(
      `INSERT INTO recuperaciones_contrasena (
         correo, token_hash, expira_en, usado, actualizado_en
       ) VALUES ($1, $2, $3, false, NOW())
       ON CONFLICT (correo)
       DO UPDATE SET
         token_hash = EXCLUDED.token_hash,
         expira_en = EXCLUDED.expira_en,
         usado = false,
         actualizado_en = NOW()`,
      [normalizedEmail, tokenHash, expiresAt],
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    await EmailService.sendPasswordResetEmail(normalizedEmail, resetUrl);

    const output: RequestPasswordResetOutput = {
      requested: true,
      expiresInMinutes,
    };

    if (RequestPasswordResetUseCase.isDevMode()) {
      output.resetToken = resetToken;
      output.resetUrl = resetUrl;
    }

    return output;
  }
}
