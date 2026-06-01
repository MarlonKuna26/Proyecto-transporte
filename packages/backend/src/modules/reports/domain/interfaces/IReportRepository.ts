import { Report, ReportStatus } from '../entities/Report';

export interface IReportRepository {
  create(report: Report): Promise<Report>;
  findById(id: string): Promise<Report | null>;
  findAll(status?: ReportStatus): Promise<Report[]>;
  findByReporterId(reporterId: string): Promise<Report[]>;
  findByReportedId(reportedId: string): Promise<Report[]>;
  update(id: string, data: Partial<Report>): Promise<Report>;
}
