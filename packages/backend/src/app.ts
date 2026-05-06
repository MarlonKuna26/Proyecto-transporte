import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Logger } from './config/logger';
import { AppError, InternalServerError } from './shared/errors/AppError';

const logger = new Logger();

class App {
  public express: Express;

  constructor() {
    this.express = express();
    this.setupMiddlewares();
  }

  private setupMiddlewares(): void {
    const defaultAllowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];

    // Seguridad
    this.express.use(helmet());

    // CORS
    this.express.use(
      cors({
        origin: process.env.CORS_ORIGIN?.split(',') || defaultAllowedOrigins,
        credentials: true,
      }),
    );

    // Body parser con límite aumentado para fotos de perfil (base64)
    this.express.use(express.json({ limit: '5mb' }));
    this.express.use(express.urlencoded({ limit: '5mb', extended: true }));

    // Logging middleware
    this.express.use((req: Request, res: Response, next: NextFunction) => {
      logger.info(`${req.method} ${req.path}`, 'HTTP');
      next();
    });

    // Health check route
    this.express.get('/health', (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'U-Ride Backend is running',
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Registrar error handlers (debe ser llamado DESPUÉS de registrar todas las rutas)
   */
  public setupErrorHandlers(): void {
    // 404 handler (debe ser ANTES del error handler)
    this.express.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.path,
      });
    });

    // Global error handler (siempre debe ser el último)
    this.express.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error(`Error: ${err.message}`, 'ERROR_HANDLER', err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          error: err.message,
          statusCode: err.statusCode,
        });
      }

      // Unknown errors
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

export { App };
