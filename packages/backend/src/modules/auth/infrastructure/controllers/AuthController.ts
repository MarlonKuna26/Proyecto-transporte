import { Request, Response } from 'express';
import { LoginUseCase } from '../../application/usecases/LoginUseCase';
import { RegisterUseCase } from '../../application/usecases/RegisterUseCase';
import { VerifyEmailUseCase } from '../../application/usecases/VerifyEmailUseCase';
import { RequestPasswordResetUseCase } from '../../application/usecases/RequestPasswordResetUseCase';
import { ResetPasswordUseCase } from '../../application/usecases/ResetPasswordUseCase';
import { LoginDTO } from '../../application/dtos/LoginDTO';
import { RegisterDTO } from '../../application/dtos/RegisterDTO';
import { AppError, ValidationError } from '@shared/errors/AppError';
import { Logger } from '@config/logger';
import { JWTService } from '@shared/services';

/**
 * AuthController
 * Capa de presentación HTTP - Autenticación
 */
export class AuthController {
  private logger = new Logger();

  constructor(
    private loginUseCase: LoginUseCase,
    private registerUseCase: RegisterUseCase,
    private verifyEmailUseCase: VerifyEmailUseCase,
    private requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, name, password } = req.body;

      if (!email || !name || !password) {
        throw new ValidationError('Email, name and password are required');
      }

      const registerDTO = new RegisterDTO(email, name, password);
      const result = await this.registerUseCase.execute(registerDTO);

      this.logger.info(`New user registered: ${email}`, 'AUTH_CONTROLLER');
      res.status(201).json({
        success: true,
        data: result,
        message: 'Registration successful. Please verify your email.',
      });
    } catch (error: unknown) {
      this.handleError(error, res, 'register');
    }
  }

  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        throw new ValidationError('Email and verification code are required');
      }

      const result = await this.verifyEmailUseCase.execute({ email, code });

      this.logger.info(`Email verified: ${email}`, 'AUTH_CONTROLLER');
      res.status(200).json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (error: unknown) {
      this.handleError(error, res, 'verify_email');
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new ValidationError('Email and password are required');
      }

      const loginDTO = new LoginDTO(email, password);
      const result = await this.loginUseCase.execute(loginDTO);

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

  async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        throw new ValidationError('Email is required');
      }

      const result = await this.requestPasswordResetUseCase.execute({ email });

      this.logger.info(`Password reset requested: ${email}`, 'AUTH_CONTROLLER');
      res.status(200).json({
        success: true,
        data: result,
        message: 'Si el correo existe, enviaremos un enlace de recuperación',
      });
    } catch (error: unknown) {
      this.handleError(error, res, 'request_password_reset');
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, code, newPassword } = req.body;

      if (!email || !code || !newPassword) {
        throw new ValidationError('Email, code, and new password are required');
      }

      const result = await this.resetPasswordUseCase.execute({ email, code, newPassword });

      this.logger.info('Password reset completed', 'AUTH_CONTROLLER');
      res.status(200).json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (error: unknown) {
      this.handleError(error, res, 'reset_password');
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new ValidationError('Refresh token is required');
      }

      const payload = JWTService.validateRefreshToken(refreshToken);
      const newAccessToken = JWTService.generateAccessToken({
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      });

      this.logger.info(`Token refreshed for user: ${payload.email}`, 'AUTH_CONTROLLER');
      res.status(200).json({
        success: true,
        data: { accessToken: newAccessToken },
        message: 'Token refreshed',
      });
    } catch (error: unknown) {
      this.handleError(error, res, 'refresh_token');
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
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
      res.status(400).json({
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
