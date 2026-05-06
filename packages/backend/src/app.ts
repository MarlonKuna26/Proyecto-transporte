
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Logger } from './config/logger';
import { AppError, InternalServerError } from './shared/errors/AppError';
import { createAuthRoutes } from './modules/auth/auth.routes';

const logger = new Logger();

class App {
  public express: Express;

  constructor() {
    this.express = express();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandlers();
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

    this.express.use(express.json());
    this.express.use(express.urlencoded({ extended: true }));

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
    this.express.use('/auth', createAuthRoutes());
  }

  private setupErrorHandlers(): void {
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