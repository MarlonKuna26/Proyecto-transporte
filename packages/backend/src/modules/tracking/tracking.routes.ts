import { Router, Request, Response } from 'express';
import { authenticateToken } from '@shared/middlewares/AuthMiddleware';
import { DatabaseConnection } from '@config/database';
import { AppError, ValidationError, NotFoundError, ForbiddenError } from '@shared/errors/AppError';
import { Logger } from '@config/logger';

const logger = new Logger();

export function createTrackingRoutes(): Router {
  const router = Router();
  const pool = DatabaseConnection.getInstance();

  // ======== GPS TRACKING ========

  // Conductor envía su ubicación actual
  router.post('/:rideId/update', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { rideId } = req.params;
      const { latitude, longitude, heading, speed } = req.body;
      const userId = req.user!.userId;

      if (latitude === undefined || longitude === undefined) {
        throw new ValidationError('latitude and longitude are required');
      }

      // Verificar que el usuario es el conductor del viaje
      const ride = await pool.query(
        "SELECT * FROM viajes WHERE id = $1 AND conductor_id = $2 AND estado = 'IN_PROGRESS'",
        [rideId, userId],
      );
      if (!ride.rows[0]) {
        throw new ForbiddenError('Only the driver of an active ride can update tracking');
      }

      // Insertar punto de tracking
      const result = await pool.query(
        `INSERT INTO seguimiento_viaje (viaje_id, latitud_actual, longitud_actual, rumbo, velocidad)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [rideId, latitude, longitude, heading || null, speed || null],
      );

      res.json({ success: true, data: result.rows[0] });
    } catch (error: unknown) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Failed to update tracking' });
      }
    }
  });

  // Obtener posición actual del viaje
  router.get('/:rideId/current', authenticateToken, async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT * FROM seguimiento_viaje WHERE viaje_id = $1 ORDER BY ultima_actualizacion DESC LIMIT 1`,
        [req.params.rideId],
      );

      if (!result.rows[0]) {
        res.json({ success: true, data: null, message: 'No tracking data available' });
        return;
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: 'Failed to fetch tracking' });
    }
  });

  // Historial de ubicaciones del viaje
  router.get('/:rideId/history', authenticateToken, async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT latitud_actual as lat, longitud_actual as lng, rumbo as heading, velocidad as speed, ultima_actualizacion as timestamp
         FROM seguimiento_viaje WHERE viaje_id = $1 ORDER BY ultima_actualizacion ASC`,
        [req.params.rideId],
      );
      res.json({ success: true, data: result.rows });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: 'Failed to fetch tracking history' });
    }
  });

  // ======== RIDE LIFECYCLE ========

  // Iniciar viaje (conductor)
  router.put('/rides/:rideId/start', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { rideId } = req.params;
      const userId = req.user!.userId;

      const ride = await pool.query(
        "SELECT * FROM viajes WHERE id = $1 AND conductor_id = $2 AND (estado = 'PUBLISHED' OR estado = 'FULL')",
        [rideId, userId],
      );
      if (!ride.rows[0]) {
        throw new NotFoundError('Ride not found or not eligible to start');
      }

      const result = await pool.query(
        "UPDATE viajes SET estado = 'IN_PROGRESS', inicio_real = NOW(), actualizado_en = NOW() WHERE id = $1 RETURNING *",
        [rideId],
      );

      // Registrar evento
      await pool.query(
        `INSERT INTO eventos_viaje (viaje_id, tipo_evento, descripcion) VALUES ($1, 'STARTED', 'Viaje iniciado por el conductor')`,
        [rideId],
      );

      logger.info(`Ride ${rideId} started`, 'TRACKING');
      res.json({ success: true, data: result.rows[0], message: 'Viaje iniciado' });
    } catch (error: unknown) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Failed to start ride' });
      }
    }
  });

  // Completar viaje (conductor)
  router.put('/rides/:rideId/complete', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { rideId } = req.params;
      const userId = req.user!.userId;

      const ride = await pool.query(
        "SELECT * FROM viajes WHERE id = $1 AND conductor_id = $2 AND estado = 'IN_PROGRESS'",
        [rideId, userId],
      );
      if (!ride.rows[0]) {
        throw new NotFoundError('Ride not found or not in progress');
      }

      const result = await pool.query(
        "UPDATE viajes SET estado = 'COMPLETED', fin_real = NOW(), actualizado_en = NOW() WHERE id = $1 RETURNING *",
        [rideId],
      );

      // Registrar evento
      await pool.query(
        `INSERT INTO eventos_viaje (viaje_id, tipo_evento, descripcion) VALUES ($1, 'COMPLETED', 'Viaje completado')`,
        [rideId],
      );

      logger.info(`Ride ${rideId} completed`, 'TRACKING');
      res.json({ success: true, data: result.rows[0], message: 'Viaje completado' });
    } catch (error: unknown) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Failed to complete ride' });
      }
    }
  });

  // ======== RIDE EVENTS / TRACEABILITY ========

  // Obtener eventos de un viaje
  router.get('/:rideId/events', authenticateToken, async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT * FROM eventos_viaje WHERE viaje_id = $1 ORDER BY creado_en ASC`,
        [req.params.rideId],
      );
      res.json({ success: true, data: result.rows });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: 'Failed to fetch events' });
    }
  });

  return router;
}
