import { Request, Response } from 'express';
import { LoginUseCase } from '../../application/usecases/LoginUseCase';
import { LoginDTO } from '../../application/dtos/LoginDTO';
import { AppError, ValidationError } from '@shared/errors/AppError';
import { Logger } from '@config/logger';
import { JWTService } from '@shared/services';

/**
 * AuthController
 * Capa de presentación HTTP
 * Maneja requests/responses y traduce a DTOs
 */
export class AuthController {
  private logger = new Logger();

  constructor(private loginUseCase: LoginUseCase) {}

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validar entrada
      if (!email || !password) {
        throw new ValidationError('Email and password are required');
      }

      // Crear DTO (valida internamente)
      const loginDTO = new LoginDTO(email, password);

      // Ejecutar UseCase
      const result = await this.loginUseCase.execute(loginDTO);

      // Respuesta exitosa
      this.logger.info(`User logged in: ${email}`, 'AUTH_CONTROLLER');
      res.status(200).json({
        success: true,
        data: result,
        message: 'Login successful',
      });
    } catch (error: unknown) {
      this.handleError(error, res, 'login');
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new ValidationError('Refresh token is required');
      }

      // Validar refresh token
      const payload = JWTService.validateRefreshToken(refreshToken);

      // Generar nuevo access token
      const newAccessToken = JWTService.generateAccessToken({
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      });

      this.logger.info(`Token refreshed for user: ${payload.email}`, 'AUTH_CONTROLLER');
      res.status(200).json({
        success: true,
        data: {
          accessToken: newAccessToken,
        },
        message: 'Token refreshed',
      });
    } catch (error: unknown) {
      this.handleError(error, res, 'refresh_token');
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      // En una implementación real, aquí se podría invalidar el token
      // en una blacklist en Redis

      this.logger.info(`User logged out: ${req.user?.email}`, 'AUTH_CONTROLLER');
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error: unknown) {
      this.handleError(error, res, 'logout');
    }
  }

  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      // El middleware de autenticación ya validó el token
      // y metió el payload en req.user

      res.status(200).json({
        success: true,
        data: req.user,
        message: 'Current user retrieved',
      });
    } catch (error: unknown) {
      this.handleError(error, res, 'get_current_user');
    }
  }

  private handleError(error: unknown, res: Response, context: string): void {
    if (error instanceof AppError) {
      this.logger.warn(`${context} failed: ${error.message}`, 'AUTH_CONTROLLER');
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else if (error instanceof Error) {
      this.logger.error(`${context} error: ${error.message}`, 'AUTH_CONTROLLER');
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    } else {
      this.logger.error(`${context} unknown error`, 'AUTH_CONTROLLER');
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}
