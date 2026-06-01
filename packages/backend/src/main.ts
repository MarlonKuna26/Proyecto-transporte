import 'reflect-metadata'; // Para decoradores
import 'module-alias/register'; // Soporte de alias de ruta en producción
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno PRIMERO desde la raíz del proyecto
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
// Por si las dudas, también cargamos el default
dotenv.config();

import { App } from './app';
import { DatabaseConnection } from './config/database';
import { Logger } from './config/logger';

// === Importar todas las rutas ===
import { createAuthRoutes } from './modules/auth/auth.routes';
import { createUserRoutes } from './modules/users/user.routes';
import { createRideRoutes } from './modules/rides/ride.routes';
import { createRideRequestRoutes } from './modules/ride-requests/ride-request.routes';
import { createRatingRoutes } from './modules/ratings/rating.routes';
import { createReportRoutes } from './modules/reports/report.routes';
import { createAdminRoutes } from './modules/admin/admin.routes';
import { createSecurityRulesRoutes } from './modules/security-rules/security-rules.routes';
import { createPaymentRoutes } from './modules/payments/payment.routes';
import { createTrackingRoutes } from './modules/tracking/tracking.routes';

const logger = new Logger();
const PORT = process.env.PORT || 3002;

async function bootstrap() {
  let server: any;

  try {
    // 1. Conectar a BD
    logger.info('Connecting to database...', 'BOOTSTRAP');
    await DatabaseConnection.connect();

    // 2. Crear instancia de Express
    const app = new App();

    // 3. Registrar TODAS las rutas
    app.express.use('/api/v1/auth', createAuthRoutes());
    app.express.use('/api/v1/users', createUserRoutes());
    app.express.use('/api/v1/rides', createRideRoutes());
    app.express.use('/api/v1/ride-requests', createRideRequestRoutes());
    app.express.use('/api/v1/ratings', createRatingRoutes());
    app.express.use('/api/v1/reports', createReportRoutes());
    app.express.use('/api/v1/admin', createAdminRoutes());
    app.express.use('/api/v1/security-rules', createSecurityRulesRoutes());
    app.express.use('/api/v1/payments', createPaymentRoutes());
    app.express.use('/api/v1/tracking', createTrackingRoutes());

    // 4. Registrar error handlers (DESPUÉS de todas las rutas)
    app.setupErrorHandlers();

    // 5. Iniciar servidor
    server = app.express.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`, 'SERVER');
      logger.info(`📍 API: http://localhost:${PORT}/api/v1`, 'SERVER');
      logger.info(`Health check: http://localhost:${PORT}/health`, 'SERVER');
      logger.info(`Env: ${process.env.NODE_ENV}`, 'SERVER');
      logger.info('', 'SERVER');
      logger.info('📌 Available Routes:', 'SERVER');
      logger.info('  POST   /api/v1/auth/register', 'SERVER');
      logger.info('  POST   /api/v1/auth/verify-email', 'SERVER');
      logger.info('  POST   /api/v1/auth/login', 'SERVER');
      logger.info('  POST   /api/v1/auth/refresh', 'SERVER');
      logger.info('  GET    /api/v1/auth/me', 'SERVER');
      logger.info('  GET    /api/v1/users/profile', 'SERVER');
      logger.info('  PUT    /api/v1/users/profile', 'SERVER');
      logger.info('  POST   /api/v1/users/vehicles', 'SERVER');
      logger.info('  GET    /api/v1/rides', 'SERVER');
      logger.info('  POST   /api/v1/rides', 'SERVER');
      logger.info('  POST   /api/v1/ride-requests', 'SERVER');
      logger.info('  POST   /api/v1/ratings', 'SERVER');
      logger.info('  POST   /api/v1/reports', 'SERVER');
      logger.info('  GET    /api/v1/admin/stats', 'SERVER');
      logger.info('  GET    /api/v1/security-rules', 'SERVER');
      logger.info('  POST   /api/v1/payments', 'SERVER');
      logger.info('  POST   /api/v1/tracking/:rideId/update', 'SERVER');
      logger.info('  GET    /api/v1/tracking/:rideId/current', 'SERVER');
      logger.info('  PUT    /api/v1/tracking/rides/:rideId/start', 'SERVER');
      logger.info('  PUT    /api/v1/tracking/rides/:rideId/complete', 'SERVER');
    });

    // Manejo de errores del servidor
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(
          `Port ${PORT} is already in use. Kill the process and try again, or use a different PORT.`,
          'SERVER',
        );
      }
      process.exit(1);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`, 'SHUTDOWN');

      if (server) {
        server.close(async () => {
          logger.info('Server closed', 'SHUTDOWN');
          await DatabaseConnection.disconnect();
          logger.info('Database disconnected', 'SHUTDOWN');
          process.exit(0);
        });
      }

      setTimeout(() => {
        logger.error('Forced shutdown after 10s', 'SHUTDOWN');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    logger.error(`Bootstrap failed: ${error}`, 'BOOTSTRAP');
    if (server) {
      server.close();
    }
    await DatabaseConnection.disconnect();
    process.exit(1);
  }
 
}

bootstrap();

export default {};
