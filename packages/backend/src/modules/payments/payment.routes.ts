import { Router, Request, Response } from 'express';
import { authenticateToken } from '@shared/middlewares/AuthMiddleware';
import { DatabaseConnection } from '@config/database';
import { AppError, ValidationError, NotFoundError } from '@shared/errors/AppError';
import { Logger } from '@config/logger';

const logger = new Logger();

export function createPaymentRoutes(): Router {
  const router = Router();
  const pool = DatabaseConnection.getInstance();

  // Crear pago
  router.post('/', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { rideId, driverId, amount, paymentMethod, reference, notes } = req.body;
      const passengerId = req.user!.userId;

      if (!rideId || !driverId || amount === undefined) {
        throw new ValidationError('rideId, driverId, and amount are required');
      }

      const result = await pool.query(
        `INSERT INTO payments (ride_id, passenger_id, driver_id, amount, payment_method, reference, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [rideId, passengerId, driverId, amount, paymentMethod || 'CASH', reference, notes],
      );

      res.status(201).json({ success: true, data: result.rows[0], message: 'Payment registered' });
    } catch (error: unknown) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
      } else if (error instanceof Error) {
        res.status(400).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Internal server error' });
      }
    }
  });

  // Mis pagos (como pasajero)
  router.get('/my-payments', authenticateToken, async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        'SELECT * FROM payments WHERE passenger_id = $1 ORDER BY created_at DESC',
        [req.user!.userId],
      );
      res.json({ success: true, data: result.rows });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: 'Failed to fetch payments' });
    }
  });

  // Pagos recibidos (como conductor)
  router.get('/received', authenticateToken, async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        'SELECT * FROM payments WHERE driver_id = $1 ORDER BY created_at DESC',
        [req.user!.userId],
      );
      res.json({ success: true, data: result.rows });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: 'Failed to fetch payments' });
    }
  });

  // Pagos de un viaje
  router.get('/ride/:rideId', authenticateToken, async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        'SELECT * FROM payments WHERE ride_id = $1 ORDER BY created_at DESC',
        [req.params.rideId],
      );
      res.json({ success: true, data: result.rows });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: 'Failed to fetch payments' });
    }
  });

  // Confirmar pago
  router.put('/:id/confirm', authenticateToken, async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        "UPDATE payments SET status = 'COMPLETED', paid_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *",
        [req.params.id],
      );
      if (!result.rows[0]) { res.status(404).json({ success: false, error: 'Payment not found' }); return; }
      res.json({ success: true, data: result.rows[0], message: 'Payment confirmed' });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: 'Failed to confirm payment' });
    }
  });

  return router;
}
