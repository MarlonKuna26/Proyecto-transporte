import { IUseCase } from '@shared/types';
import { IReportRepository } from '../../domain/interfaces/IReportRepository';
import { IUserRepository } from '@modules/auth/domain/interfaces/IUserRepository';
import { Report } from '../../domain/entities/Report';
import { ResolveReportDTO } from '../dtos/ReportDTO';
import { NotFoundError } from '@shared/errors/AppError';
import { DatabaseConnection } from '@config/database';
import { EmailService } from '@shared/services/EmailService';

interface ResolveReportInput { reportId: string; adminId: string; data: ResolveReportDTO; }

export class ResolveReportUseCase implements IUseCase<ResolveReportInput, Report> {
  constructor(
    private reportRepo: IReportRepository,
    private userRepo: IUserRepository,
  ) {}

  async execute(input: ResolveReportInput): Promise<Report> {
    const report = await this.reportRepo.findById(input.reportId);
    if (!report) throw new NotFoundError('Reporte no encontrado');

    const pool = DatabaseConnection.getInstance();

    // Aplicar acción al usuario reportado si es necesario
    if (input.data.action === 'SUSPEND' && input.data.suspensionDays) {
      const suspendedUntil = new Date();
      suspendedUntil.setDate(suspendedUntil.getDate() + input.data.suspensionDays);

      await pool.query(
        `UPDATE usuarios SET esta_suspendido = true, motivo_suspension = $1, suspendido_hasta = $2, actualizado_en = NOW() WHERE id = $3`,
        [input.data.adminNotes, suspendedUntil, report.reportedId],
      );
    }

    await this.reportRepo.update(input.reportId, {
      status: input.data.status,
      adminNotes: input.data.adminNotes,
      resolvedBy: input.adminId,
      resolvedAt: new Date(),
    } as any);

    // Send email to reporter
    const reporterQuery = await pool.query('SELECT correo FROM usuarios WHERE id = $1', [report.reporterId]);
    if (reporterQuery.rowCount && reporterQuery.rowCount > 0) {
      const reporterEmail = reporterQuery.rows[0].correo;
      try {
        await EmailService.sendReportResolvedEmail(reporterEmail, {
          reportReason: report.reason,
          adminNotes: input.data.adminNotes || 'Resuelto de acuerdo a las políticas de la institución.'
        });
      } catch (err) {
        console.warn('Warning: Failed to send report resolution email:', err);
      }
    }

    const updatedReport = await this.reportRepo.findById(input.reportId);
    return updatedReport!;
  }
}
