import { Router, Request, Response } from 'express';
import { authenticateToken } from '@shared/middlewares/AuthMiddleware';
import { DatabaseConnection } from '@config/database';
import { Logger } from '@config/logger';

const logger = new Logger();

export function createSecurityRulesRoutes(): Router {
  const router = Router();
  const pool = DatabaseConnection.getInstance();

  // Listar reglas activas (público para usuarios auth)
  router.get('/', authenticateToken, async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        'SELECT id, title, description, icon, display_order FROM security_rules WHERE is_active = true ORDER BY display_order ASC',
      );
      res.json({ success: true, data: result.rows });
    } catch (error: unknown) {
      logger.error(`Security rules error: ${error}`, 'SECURITY_RULES');
      res.status(500).json({ success: false, error: 'Failed to fetch security rules' });
    }
  });

  return router;
}
