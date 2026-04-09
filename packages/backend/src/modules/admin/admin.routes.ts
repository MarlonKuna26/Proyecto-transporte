import { Router, Request, Response } from 'express';
import { authenticateToken, authorizeRole } from '@shared/middlewares/AuthMiddleware';
import { DatabaseConnection } from '@config/database';
import { AppError } from '@shared/errors/AppError';
import { Logger } from '@config/logger';

const logger = new Logger();

export function createAdminRoutes(): Router {
  const router = Router();
  const pool = DatabaseConnection.getInstance();

  // Dashboard stats
  router.get('/stats', authenticateToken, authorizeRole('ADMIN'), async (req: Request, res: Response) => {
    try {
      const [users, rides, requests, reports, ratings] = await Promise.all([
        pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE esta_verificado = true) as verified, COUNT(*) FILTER (WHERE esta_suspendido = true) as suspended FROM usuarios'),
        pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE estado = 'PUBLISHED') as active, COUNT(*) FILTER (WHERE estado = 'COMPLETED') as completed FROM viajes"),
        pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE estado = 'PENDING') as pending, COUNT(*) FILTER (WHERE estado = 'ACCEPTED') as accepted FROM solicitudes_viaje"),
        pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE estado = 'PENDING') as pending FROM reportes"),
        pool.query('SELECT COUNT(*) as total, COALESCE(AVG(puntuacion), 0) as avg_score FROM calificaciones'),
      ]);

      res.json({
        success: true,
        data: {
          users: users.rows[0],
          rides: rides.rows[0],
          requests: requests.rows[0],
          reports: reports.rows[0],
          ratings: { total: ratings.rows[0].total, avgScore: parseFloat(parseFloat(ratings.rows[0].avg_score).toFixed(2)) },
        },
      });
    } catch (error: unknown) {
      logger.error(`Admin stats error: ${error}`, 'ADMIN');
      res.status(500).json({ success: false, error: 'Failed to fetch stats' });
    }
  });

  // Listar usuarios
  router.get('/users', authenticateToken, authorizeRole('ADMIN'), async (req: Request, res: Response) => {
    try {
      const result = await pool.query('SELECT id, correo as email, nombre as name, rol as role, esta_verificado as is_verified, esta_suspendido as is_suspended, reputacion as reputation, creado_en as created_at FROM usuarios ORDER BY creado_en DESC');
      res.json({ success: true, data: result.rows });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
  });

  // Suspender usuario
  router.put('/users/:id/suspend', authenticateToken, authorizeRole('ADMIN'), async (req: Request, res: Response) => {
    try {
      const { reason, days } = req.body;
      if (!reason) { res.status(400).json({ success: false, error: 'Reason is required' }); return; }

      const suspendedUntil = new Date();
      suspendedUntil.setDate(suspendedUntil.getDate() + (days || 7));

      await pool.query(
        'UPDATE usuarios SET esta_suspendido = true, motivo_suspension = $1, suspendido_hasta = $2, actualizado_en = NOW() WHERE id = $3',
        [reason, suspendedUntil, req.params.id],
      );

      logger.info(`User ${req.params.id} suspended by admin`, 'ADMIN');
      res.json({ success: true, message: 'User suspended' });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: 'Failed to suspend user' });
    }
  });

  // Reactivar usuario
  router.put('/users/:id/unsuspend', authenticateToken, authorizeRole('ADMIN'), async (req: Request, res: Response) => {
    try {
      await pool.query(
        'UPDATE usuarios SET esta_suspendido = false, motivo_suspension = NULL, suspendido_hasta = NULL, actualizado_en = NOW() WHERE id = $1',
        [req.params.id],
      );
      logger.info(`User ${req.params.id} unsuspended by admin`, 'ADMIN');
      res.json({ success: true, message: 'User unsuspended' });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: 'Failed to unsuspend user' });
    }
  });

  // Advertir usuario
  router.post('/users/:id/warn', authenticateToken, authorizeRole('ADMIN'), async (req: Request, res: Response) => {
    try {
      const { message } = req.body;
      if (!message) { res.status(400).json({ success: false, error: 'Warning message is required' }); return; }

      await pool.query(
        `INSERT INTO registros_auditoria (tipo_entidad, id_entidad, accion, cambios, realizado_por) VALUES ('USER', $1, 'WARNING', $2, $3)`,
        [req.params.id, JSON.stringify({ message }), req.user!.userId],
      );

      logger.info(`Warning issued to user ${req.params.id}`, 'ADMIN');
      res.json({ success: true, message: 'Warning issued' });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: 'Failed to issue warning' });
    }
  });

  return router;
}
