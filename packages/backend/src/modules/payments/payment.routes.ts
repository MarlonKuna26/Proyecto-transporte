import { Router, Request, Response } from 'express';
import { authenticateToken } from '@shared/middlewares/AuthMiddleware';
import { DatabaseConnection } from '@config/database';
import { AppError, ValidationError, NotFoundError } from '@shared/errors/AppError';
import { Logger } from '@config/logger';

const logger = new Logger();

export function createPaymentRoutes(): Router {
  const router = Router();
  const pool = DatabaseConnection.getInstance();

  // Crear pago (pasajero paga por su solicitud aceptada)
  router.post('/', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { rideRequestId, amount, paymentMethod, reference, comprobanteUrl } = req.body;
      const userId = req.user!.userId;

      if (!rideRequestId || amount === undefined) {
        throw new ValidationError('rideRequestId and amount are required');
      }

      // Verificar que la solicitud existe y pertenece al usuario
      const reqResult = await pool.query(
        "SELECT * FROM solicitudes_viaje WHERE id = $1 AND pasajero_id = $2 AND estado = 'ACCEPTED'",
        [rideRequestId, userId],
      );
      if (!reqResult.rows[0]) {
        throw new NotFoundError('Accepted ride request not found');
      }

      const result = await pool.query(
        `INSERT INTO pagos (solicitud_viaje_id, monto, metodo_pago, estado, referencia_transaccion, comprobante_url)
         VALUES ($1, $2, $3, 'PENDING', $4, $5) RETURNING *`,
        [rideRequestId, amount, paymentMethod || 'CASH', reference || null, comprobanteUrl || null],
      );

      // Registrar evento
      const rideId = reqResult.rows[0].viaje_id;
      await pool.query(
        `INSERT INTO eventos_viaje (viaje_id, tipo_evento, descripcion) VALUES ($1, 'PAYMENT_CREATED', $2)`,
        [rideId, `Pago creado por $${amount} - método: ${paymentMethod || 'CASH'}`],
      );

      res.status(201).json({ success: true, data: result.rows[0], message: 'Pago registrado' });
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

  // Mis pagos (como pasajero) - con info del viaje
  router.get('/my-payments', authenticateToken, async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT p.*, sv.viaje_id, sv.pasajero_id, v.zona_origen, v.zona_destino, v.fecha_salida, v.hora_salida, v.conductor_id
         FROM pagos p
         JOIN solicitudes_viaje sv ON p.solicitud_viaje_id = sv.id
         JOIN viajes v ON sv.viaje_id = v.id
         WHERE sv.pasajero_id = $1
         ORDER BY p.creado_en DESC`,
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
        `SELECT p.*, sv.viaje_id, sv.pasajero_id, v.zona_origen, v.zona_destino, v.fecha_salida, v.hora_salida,
                u.nombre as nombre_pasajero
         FROM pagos p
         JOIN solicitudes_viaje sv ON p.solicitud_viaje_id = sv.id
         JOIN viajes v ON sv.viaje_id = v.id
         JOIN usuarios u ON sv.pasajero_id = u.id
         WHERE v.conductor_id = $1
         ORDER BY p.creado_en DESC`,
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
        `SELECT p.*, sv.pasajero_id, u.nombre as nombre_pasajero
         FROM pagos p
         JOIN solicitudes_viaje sv ON p.solicitud_viaje_id = sv.id
         JOIN usuarios u ON sv.pasajero_id = u.id
         WHERE sv.viaje_id = $1
         ORDER BY p.creado_en DESC`,
        [req.params.rideId],
      );
      res.json({ success: true, data: result.rows });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: 'Failed to fetch payments' });
    }
  });

  // Confirmar pago (conductor confirma recepción)
  router.put('/:id/confirm', authenticateToken, async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        "UPDATE pagos SET estado = 'COMPLETED', actualizado_en = NOW() WHERE id = $1 RETURNING *",
        [req.params.id],
      );
      if (!result.rows[0]) { res.status(404).json({ success: false, error: 'Payment not found' }); return; }
      res.json({ success: true, data: result.rows[0], message: 'Pago confirmado' });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: 'Failed to confirm payment' });
    }
  });

  // Reembolsar pago
  router.put('/:id/refund', authenticateToken, async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        "UPDATE pagos SET estado = 'REFUNDED', actualizado_en = NOW() WHERE id = $1 RETURNING *",
        [req.params.id],
      );
      if (!result.rows[0]) { res.status(404).json({ success: false, error: 'Payment not found' }); return; }
      res.json({ success: true, data: result.rows[0], message: 'Pago reembolsado' });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: 'Failed to refund payment' });
    }
  });

  // Resumen de pagos del usuario
  router.get('/summary', authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const [sent, received] = await Promise.all([
        pool.query(
          `SELECT COUNT(*) as total, COALESCE(SUM(p.monto), 0) as monto_total,
           COUNT(*) FILTER (WHERE p.estado = 'COMPLETED') as completados,
           COUNT(*) FILTER (WHERE p.estado = 'PENDING') as pendientes
           FROM pagos p JOIN solicitudes_viaje sv ON p.solicitud_viaje_id = sv.id
           WHERE sv.pasajero_id = $1`, [userId]
        ),
        pool.query(
          `SELECT COUNT(*) as total, COALESCE(SUM(p.monto), 0) as monto_total,
           COUNT(*) FILTER (WHERE p.estado = 'COMPLETED') as completados,
           COUNT(*) FILTER (WHERE p.estado = 'PENDING') as pendientes
           FROM pagos p JOIN solicitudes_viaje sv ON p.solicitud_viaje_id = sv.id
           JOIN viajes v ON sv.viaje_id = v.id
           WHERE v.conductor_id = $1`, [userId]
        ),
      ]);
      res.json({
        success: true,
        data: {
          sent: sent.rows[0],
          received: received.rows[0],
        },
      });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: 'Failed to fetch summary' });
    }
  });

  return router;
}
