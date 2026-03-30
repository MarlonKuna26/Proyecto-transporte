import { IUseCase } from '@shared/types';
import { IReportRepository } from '../../domain/interfaces/IReportRepository';
import { IUserRepository } from '@modules/auth/domain/interfaces/IUserRepository';
import { Report } from '../../domain/entities/Report';
import { ResolveReportDTO } from '../dtos/ReportDTO';
import { NotFoundError } from '@shared/errors/AppError';
import { DatabaseConnection } from '@config/database';

interface ResolveReportInput { reportId: string; adminId: string; data: ResolveReportDTO; }

export class ResolveReportUseCase implements IUseCase<ResolveReportInput, Report> {
  constructor(
    private reportRepo: IReportRepository,
    private userRepo: IUserRepository,
  ) {}

  async execute(input: ResolveReportInput): Promise<Report> {
    const report = await this.reportRepo.findById(input.reportId);
    if (!report) throw new NotFoundError('Report not found');

    // Aplicar acción al usuario reportado si es necesario
    if (input.data.action === 'SUSPEND' && input.data.suspensionDays) {
      const suspendedUntil = new Date();
      suspendedUntil.setDate(suspendedUntil.getDate() + input.data.suspensionDays);

      const pool = DatabaseConnection.getInstance();
      await pool.query(
        `UPDATE users SET is_suspended = true, suspension_reason = $1, suspended_until = $2, updated_at = NOW() WHERE id = $3`,
        [input.data.adminNotes, suspendedUntil, report.reportedId],
      );
    }

    return this.reportRepo.update(input.reportId, {
      status: input.data.status,
      adminNotes: input.data.adminNotes,
      resolvedBy: input.adminId,
      resolvedAt: new Date(),
    } as any);
  }
}
