import { Router } from 'express';
import { authenticateToken, authorizeRole } from '@shared/middlewares/AuthMiddleware';
import { ReportRepository } from './infrastructure/repositories/ReportRepository';
import { UserRepository } from '@modules/auth/infrastructure/repositories/UserRepository';
import { CreateReportUseCase } from './application/usecases/CreateReportUseCase';
import { ListReportsUseCase } from './application/usecases/ListReportsUseCase';
import { ResolveReportUseCase } from './application/usecases/ResolveReportUseCase';
import { ListMyReportsUseCase } from './application/usecases/ListMyReportsUseCase';
import { ReportController } from './infrastructure/controllers/ReportController';

export function createReportRoutes(): Router {
  const router = Router();

  const reportRepo = new ReportRepository();
  const userRepo = new UserRepository();
  const createUseCase = new CreateReportUseCase(reportRepo);
  const listUseCase = new ListReportsUseCase(reportRepo);
  const resolveUseCase = new ResolveReportUseCase(reportRepo, userRepo);
  const listMyReportsUseCase = new ListMyReportsUseCase(reportRepo);

  const controller = new ReportController(createUseCase, listUseCase, resolveUseCase, listMyReportsUseCase);

  // Estudiante crea reporte
  router.post('/', authenticateToken, (req, res) => controller.create(req, res));
  
  // Estudiante ve sus propios reportes
  router.get('/me', authenticateToken, (req, res) => controller.listMyReports(req, res));

  // Admin ve y resuelve reportes
  router.get('/', authenticateToken, authorizeRole('ADMIN'), (req, res) => controller.list(req, res));
  router.put('/:id/resolve', authenticateToken, authorizeRole('ADMIN'), (req, res) => controller.resolve(req, res));

  return router;
}
