import { IUseCase } from '@shared/types';
import { IReportRepository } from '../../domain/interfaces/IReportRepository';
import { Report } from '../../domain/entities/Report';
import { CreateReportDTO } from '../dtos/ReportDTO';
import { ValidationError } from '@shared/errors/AppError';

interface CreateReportInput { reporterId: string; data: CreateReportDTO; }

export class CreateReportUseCase implements IUseCase<CreateReportInput, Report> {
  constructor(private reportRepo: IReportRepository) {}

  async execute(input: CreateReportInput): Promise<Report> {
    if (input.reporterId === input.data.reportedId) {
      throw new ValidationError('You cannot report yourself');
    }

    const report = new Report(
      input.reporterId, input.data.reportedId, input.data.reason,
      input.data.description, input.data.rideId || null, input.data.evidenceUrl || null,
    );
    return this.reportRepo.create(report);
  }
}
