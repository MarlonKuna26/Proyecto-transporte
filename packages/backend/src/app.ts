
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Logger } from './config/logger';
import { AppError, InternalServerError } from './shared/errors/AppError';
import { createAuthRoutes } from './modules/auth/auth.routes';
import { createPaymentRoutes } from './modules/payments/payment.routes';
import { createRideRequestRoutes } from './modules/ride-requests/ride-request.routes';
import { createRideRoutes } from './modules/rides/ride.routes';
import { createUserRoutes } from './modules/users/user.routes';
import { createRatingRoutes } from './modules/ratings/rating.routes';
import { createReportRoutes } from './modules/reports/report.routes';
import { createTrackingRoutes } from './modules/tracking/tracking.routes';
import { createAdminRoutes } from './modules/admin/admin.routes';
import { createSecurityRulesRoutes } from './modules/security-rules/security-rules.routes';

const logger = new Logger();

export class App {
  public express: Express;

  constructor() {
    this.express = express();
    this.setupMiddlewares();
    this.setupRoutes();
  }

  private setupMiddlewares(): void {
    const defaultAllowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];

    this.express.use(helmet());

    this.express.use(
      cors({
        origin: process.env.CORS_ORIGIN?.split(',') || defaultAllowedOrigins,
        credentials: true,
      }),
    );

    
    // Body parser con límite aumentado para fotos de perfil (base64)
    this.express.use(express.json({ limit: '5mb' }));
    this.express.use(express.urlencoded({ limit: '5mb', extended: true }));

    this.express.use((req: Request, res: Response, next: NextFunction) => {
      logger.info(`${req.method} ${req.path}`, 'HTTP');
      next();
    });

    this.express.get('/health', (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'U-Ride Backend is running',
        timestamp: new Date().toISOString(),
      });
    });
  }

  private setupRoutes(): void {
    this.express.get('/', (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'Welcome to U-Ride API',
        version: '1.0.0',
        endpoints: '/api/v1'
      });
    });

    const apiV1 = express.Router();

    // Registrar módulos en el router v1
    apiV1.use('/auth', createAuthRoutes());
    apiV1.use('/payments', createPaymentRoutes());
    apiV1.use('/ride-requests', createRideRequestRoutes());
    apiV1.use('/rides', createRideRoutes());
    apiV1.use('/users', createUserRoutes());
    apiV1.use('/ratings', createRatingRoutes());
    apiV1.use('/reports', createReportRoutes());
    apiV1.use('/tracking', createTrackingRoutes());
    apiV1.use('/admin', createAdminRoutes());
    apiV1.use('/security-rules', createSecurityRulesRoutes());

    // Montar el router v1 en la app
    this.express.use('/api/v1', apiV1);

    // Endpoint de depuración para ver las rutas cargadas
    this.express.get('/api/v1/debug-routes', (req, res) => {
      const routes: any[] = [];
      this.express._router.stack.forEach((middleware: any) => {
        if (middleware.route) {
          routes.push(`${Object.keys(middleware.route.methods)} ${middleware.route.path}`);
        } else if (middleware.name === 'router') {
          middleware.handle.stack.forEach((handler: any) => {
            if (handler.route) {
              routes.push(`${Object.keys(handler.route.methods)} ${middleware.regexp} ${handler.route.path}`);
            }
          });
        }
      });
      res.json({ success: true, routes });
    });

    // Mantener compatibilidad con rutas sin /api/v1 si es necesario
    this.express.use('/auth', createAuthRoutes());
  }

  public setupErrorHandlers(): void {
    this.express.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.path,
      });
    });

    this.express.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error(`Error: ${err.message}`, 'ERROR_HANDLER', err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          error: err.message,
          statusCode: err.statusCode,
        });
      }

      const internalError = new InternalServerError(
        err.message || 'An unexpected error occurred',
      );

      res.status(internalError.statusCode).json({
        success: false,
        error: internalError.message,
        statusCode: internalError.statusCode,
      });
    });
  }
}

const appInstance = new App();

export default appInstance.express;