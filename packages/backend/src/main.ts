import 'reflect-metadata'; // Para decoradores
import * as dotenv from 'dotenv';

// Cargar variables de entorno PRIMERO
dotenv.config();

import { App } from './app';
import { DatabaseConnection } from './config/database';
import { Logger } from './config/logger';
import { createAuthRoutes } from './modules/auth/auth.routes';

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

    // 3. Registrar rutas ANTES de error handlers
    app.express.use('/api/v1/auth', createAuthRoutes());
    // TODO: app.express.use('/api/v1/rides', createRideRoutes());
    // TODO: app.express.use('/api/v1/users', createUserRoutes());

    // 4. Registrar error handlers (DESPUÉS de todas las rutas)
    app.setupErrorHandlers();

    // 5. Iniciar servidor
    server = app.express.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`, 'SERVER');
      logger.info(`📍 API: http://localhost:${PORT}/api/v1`, 'SERVER');
      logger.info(`Health check: http://localhost:${PORT}/health`, 'SERVER');
      logger.info(`Env: ${process.env.NODE_ENV}`, 'SERVER');
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

      // Forzar salida después de 10 segundos
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




