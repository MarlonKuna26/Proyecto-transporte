
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Logger } from './config/logger';
import { AppError, InternalServerError } from './shared/errors/AppError';
import { createAuthRoutes } from './modules/auth/auth.routes';

const logger = new Logger();

export class App {
  public express: Express;

  constructor() {
    this.express = express();
    this.setupMiddlewares();
    this.setupRoutes();
  }

  private setupMiddlewares(): void {
    const defaultAllowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173'];

    this.express.use(helmet());

    const corsOptions = {
      origin: function (origin: any, callback: any) {
        if (!origin || origin.includes('localhost') || origin.includes('vercel.app')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true
    };

    this.express.use(cors(corsOptions));
    this.express.options('*', cors(corsOptions));

    
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
    this.express.use('/auth', createAuthRoutes());
    // Compatibilidad: exponer también el prefijo /api/v1/auth usado en tests y en main
    this.express.use('/api/v1/auth', createAuthRoutes());
  }

  public setupErrorHandlers(): void {
    this.express.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: 'Ruta no encontrada',
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