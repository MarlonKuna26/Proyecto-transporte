import { Router } from 'express';
import { UserRepository } from './infrastructure/repositories/UserRepository';
import { LoginUseCase } from './application/usecases/LoginUseCase';
import { RegisterUseCase } from './application/usecases/RegisterUseCase';
import { VerifyEmailUseCase } from './application/usecases/VerifyEmailUseCase';
import { RequestPasswordResetUseCase } from './application/usecases/RequestPasswordResetUseCase';
import { ResetPasswordUseCase } from './application/usecases/ResetPasswordUseCase';
import { AuthController } from './infrastructure/controllers/AuthController';
import { authenticateToken } from '@shared/middlewares/AuthMiddleware';

/**
 * Auth Routes
 * Factory Pattern: crea todas las dependencias necesarias
 */
export function createAuthRoutes(): Router {
  const router = Router();

  // === Inyección de Dependencias ===
  const userRepository = new UserRepository();
  const loginUseCase = new LoginUseCase(userRepository);
  const registerUseCase = new RegisterUseCase(userRepository);
  const verifyEmailUseCase = new VerifyEmailUseCase(userRepository);
  const requestPasswordResetUseCase = new RequestPasswordResetUseCase(userRepository);
  const resetPasswordUseCase = new ResetPasswordUseCase(userRepository);
  const authController = new AuthController(
    loginUseCase,
    registerUseCase,
    verifyEmailUseCase,
    requestPasswordResetUseCase,
    resetPasswordUseCase,
  );

  // === Rutas Públicas ===
  router.post('/register', (req, res) => authController.register(req, res));
  router.post('/verify-email', (req, res) => authController.verifyEmail(req, res));
  router.post('/login', (req, res) => authController.login(req, res));
  router.post('/refresh', (req, res) => authController.refreshToken(req, res));
  router.post('/forgot-password', (req, res) => authController.requestPasswordReset(req, res));
  router.post('/reset-password', (req, res) => authController.resetPassword(req, res));

  // === Rutas Protegidas ===
  router.get('/me', authenticateToken, (req, res) => authController.getCurrentUser(req, res));
  router.post('/logout', authenticateToken, (req, res) => authController.logout(req, res));
router.get('/test', (req, res) => {
  console.log('TEST ROUTE HIT 🔥');
  res.send('AUTH OK 🔥');
});
  return router;
}

export {
  AuthController,
  LoginUseCase,
  RegisterUseCase,
  VerifyEmailUseCase,
  RequestPasswordResetUseCase,
  ResetPasswordUseCase,
  UserRepository,
};
