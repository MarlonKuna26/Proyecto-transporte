/**
 * Middleware: AuthMiddleware
 * Valida que el usuario tenga un token JWT válido
 *
 * Uso:
 * app.use('/api/protected', authenticateToken, controller);
 *
 * El token debe venir en el header Authorization:
 * Authorization: Bearer <token>
 */

import { Request, Response, NextFunction } from 'express';
import { JWTService, JWTPayload } from '@shared/services';
import { UnauthorizedError } from '@shared/errors/AppError';
import { Logger } from '@config/logger';

const logger = new Logger();

/**
 * Extender tipo de Request para incluir usuario autenticado
 */
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware para autenticación por JWT
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // 1. Extraer token del header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      logger.warn('Token de autorización ausente', 'AUTH_MIDDLEWARE');
      throw new UnauthorizedError('Token de autorización ausente');
    }

    // 2. Validar token
    const payload = JWTService.validateAccessToken(token);

    // 3. Agregar payload al request
    req.user = payload;

    // 4. Continuar
    next();
  } catch (error) {
    logger.warn(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'AUTH_MIDDLEWARE');

    if (error instanceof UnauthorizedError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'No autorizado',
      });
    }
  }
};

/**
 * Middleware para verificar que el usuario tenga rol específico
 */
export const authorizeRole =
  (...allowedRoles: Array<'STUDENT' | 'ADMIN'>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(
        `El usuario ${req.user.userId} intentó acceder a un recurso restringido`,
        'AUTH_MIDDLEWARE',
      );
      res.status(403).json({
        success: false,
        error: 'Acceso prohibido: permisos insuficientes',
      });
      return;
    }

    next();
  };
