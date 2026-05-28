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

  // ==========================================
  // PayPal Integration Endpoints
  // ==========================================
  
  // Generar Token de Acceso para PayPal usando credenciales .env
  const generatePayPalAccessToken = async (): Promise<string> => {
    try {
      const clientId = process.env.Client_ID_PYP;
      const appSecret = process.env.SECRET_KEY_PYP;
      if (!clientId || !appSecret) {
        throw new Error('PayPal credentials are not set in environment variables.');
      }
      const auth = Buffer.from(`${clientId}:${appSecret}`).toString('base64');
      const response = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
        method: 'POST',
        body: 'grant_type=client_credentials',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      const data = (await response.json()) as any;
      if (!response.ok) {
        throw new Error(`PayPal Auth Error: ${data.error_description || data.error}`);
      }
      return data.access_token;
    } catch (error) {
      logger.error('Error generating PayPal access token', 'PAYPAL_AUTH', error);
      throw error;
    }
  };

  // Crear una orden en PayPal (Retorna el orderID al frontend)
  router.post('/paypal/create-order', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { rideRequestId, amount } = req.body;
      const userId = req.user!.userId;

      if (!rideRequestId || amount === undefined) {
        throw new ValidationError('rideRequestId and amount are required');
      }

      // Validar que la solicitud de viaje pertenece al usuario y está aceptada
      const reqResult = await pool.query(
        "SELECT * FROM solicitudes_viaje WHERE id = $1 AND pasajero_id = $2 AND estado = 'ACCEPTED'",
        [rideRequestId, userId],
      );
      if (!reqResult.rows[0]) {
        throw new NotFoundError('Accepted ride request not found');
      }

      const accessToken = await generatePayPalAccessToken();
      const url = 'https://api-m.sandbox.paypal.com/v2/checkout/orders';

      const payload = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: `ride_${rideRequestId}`,
            amount: {
              currency_code: 'USD',
              value: parseFloat(amount).toFixed(2), // Formato para PayPal (ej. 10.50)
            },
          },
        ],
      };

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as any;
      if (!response.ok) {
        throw new Error(`PayPal Order Creation Error: ${data.message || JSON.stringify(data)}`);
      }

      res.status(201).json({ success: true, orderID: data.id });
    } catch (error: unknown) {
      logger.error('Error in POST /paypal/create-order', 'PAYPAL_CREATE_ORDER', error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal Server Error' });
    }
  });

  // Capturar una orden y guardarla de forma segura en la base de datos
  router.post('/paypal/capture-order', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { orderID, rideRequestId, amount } = req.body;
      const userId = req.user!.userId;

      if (!orderID || !rideRequestId || amount === undefined) {
        throw new ValidationError('orderID, rideRequestId, and amount are required');
      }

      const accessToken = await generatePayPalAccessToken();
      const url = `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}/capture`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = (await response.json()) as any;

      // Verificar que la API de PayPal retorne que el pago fue exitoso y el estado es COMPLETED
      // No confiamos en la respuesta del frontend, hacemos el capture desde el backend.
      if (data.status === 'COMPLETED') {
        const reqResult = await pool.query(
          "SELECT viaje_id FROM solicitudes_viaje WHERE id = $1 AND pasajero_id = $2",
          [rideRequestId, userId],
        );
        
        if (!reqResult.rows[0]) {
          throw new NotFoundError('Ride request not found for capture');
        }
        
        const rideId = reqResult.rows[0].viaje_id;

        // Guardar el pago en BD con estado COMPLETED automáticamente
        const result = await pool.query(
          `INSERT INTO pagos (solicitud_viaje_id, monto, metodo_pago, estado, referencia_transaccion)
           VALUES ($1, $2, 'PAYPAL', 'COMPLETED', $3) RETURNING *`,
          [rideRequestId, amount, orderID],
        );

        // Registrar el evento de viaje
        await pool.query(
          `INSERT INTO eventos_viaje (viaje_id, tipo_evento, descripcion) VALUES ($1, 'PAYMENT_COMPLETED', $2)`,
          [rideId, `Pago por PayPal completado por $${amount}. Orden: ${orderID}`],
        );

        res.status(200).json({ success: true, data: result.rows[0], message: 'Pago con PayPal confirmado exitosamente' });
      } else {
        res.status(400).json({ success: false, error: 'Payment could not be completed at PayPal' });
      }
    } catch (error: unknown) {
      logger.error('Error in POST /paypal/capture-order', 'PAYPAL_CAPTURE_ORDER', error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal Server Error' });
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
