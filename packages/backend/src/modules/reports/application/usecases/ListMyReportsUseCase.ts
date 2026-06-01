import { IUseCase } from '@shared/types';
import { IReportRepository } from '../../domain/interfaces/IReportRepository';
import { Report } from '../../domain/entities/Report';

export class ListMyReportsUseCase implements IUseCase<string, Report[]> {
  constructor(private reportRepo: IReportRepository) {}

  async execute(reporterId: string): Promise<Report[]> {
    return this.reportRepo.findByReporterId(reporterId);
  }
}
