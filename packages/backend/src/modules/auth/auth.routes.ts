import { Router } from 'express';
import { UserRepository } from './infrastructure/repositories/UserRepository';
import { LoginUseCase } from './application/usecases/LoginUseCase';
import { AuthController } from './infrastructure/controllers/AuthController';
import { authenticateToken } from '@shared/middlewares/AuthMiddleware';

/**
 * Auth Routes
 * Consolidación de todas las rutas de autenticación
 * Factory Pattern: crea todas las dependencias necesarias
 */
export function createAuthRoutes(): Router {
  const router = Router();

  // === Inyección de Dependencias ===
  const userRepository = new UserRepository();
  const loginUseCase = new LoginUseCase(userRepository);
  const authController = new AuthController(loginUseCase);

  // === Rutas Públicas ===
  router.post('/login', (req, res) => authController.login(req, res));
  router.post('/refresh', (req, res) => authController.refreshToken(req, res));

  // === Rutas Protegidas ===
  router.get('/me', authenticateToken, (req, res) => authController.getCurrentUser(req, res));
  router.post('/logout', authenticateToken, (req, res) => authController.logout(req, res));

  return router;
}

export { AuthController, LoginUseCase, UserRepository };
