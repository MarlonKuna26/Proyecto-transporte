import { IUseCase } from '@shared/types';
import { IReportRepository } from '../../domain/interfaces/IReportRepository';
import { Report, ReportStatus } from '../../domain/entities/Report';

export class ListReportsUseCase implements IUseCase<ReportStatus | undefined, Report[]> {
  constructor(private reportRepo: IReportRepository) {}
  async execute(status?: ReportStatus): Promise<Report[]> {
    return this.reportRepo.findAll(status);
  }
}
