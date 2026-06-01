import { Request, Response } from 'express';
import { CreateReportUseCase } from '../../application/usecases/CreateReportUseCase';
import { ListReportsUseCase } from '../../application/usecases/ListReportsUseCase';
import { ResolveReportUseCase } from '../../application/usecases/ResolveReportUseCase';
import { ListMyReportsUseCase } from '../../application/usecases/ListMyReportsUseCase';
import { CreateReportDTO, ResolveReportDTO } from '../../application/dtos/ReportDTO';
import { ReportStatus } from '../../domain/entities/Report';
import { AppError } from '@shared/errors/AppError';
import { Logger } from '@config/logger';

export class ReportController {
  private logger = new Logger();

  constructor(
    private createReportUseCase: CreateReportUseCase,
    private listReportsUseCase: ListReportsUseCase,
    private resolveReportUseCase: ResolveReportUseCase,
    private listMyReportsUseCase: ListMyReportsUseCase,
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const reporterId = req.user!.userId;
      const dto = new CreateReportDTO(req.body);
      const result = await this.createReportUseCase.execute({ reporterId, data: dto });
      res.status(201).json({ success: true, data: result, message: 'Report submitted' });
    } catch (error: unknown) {
      this.handleError(error, res, 'create_report');
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const status = req.query.status as ReportStatus | undefined;
      const result = await this.listReportsUseCase.execute(status);
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      this.handleError(error, res, 'list_reports');
    }
  }

  async listMyReports(req: Request, res: Response): Promise<void> {
    try {
      const reporterId = req.user!.userId;
      const result = await this.listMyReportsUseCase.execute(reporterId);
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      this.handleError(error, res, 'list_my_reports');
    }
  }

  async resolve(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.user!.userId;
      const dto = new ResolveReportDTO(req.body);
      const result = await this.resolveReportUseCase.execute({
        reportId: req.params.id, adminId, data: dto,
      });
      res.status(200).json({ success: true, data: result, message: 'Report resolved' });
    } catch (error: unknown) {
      this.handleError(error, res, 'resolve_report');
    }
  }

  private handleError(error: unknown, res: Response, context: string): void {
    if (error instanceof AppError) {
      this.logger.warn(`${context}: ${error.message}`, 'REPORT_CONTROLLER');
      res.status(error.statusCode).json({ success: false, error: error.message });
    } else if (error instanceof Error) {
      res.status(400).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}
