import express from 'express';
import request from 'supertest';
import { authenticateToken, authorizeRole } from '../../src/shared/middlewares/AuthMiddleware';
import { JWTService } from '@shared/services';

jest.mock('@shared/services', () => ({
  JWTService: {
    validateAccessToken: jest.fn(),
  },
}));

const app = express();

// rutas reales
app.get('/protected', authenticateToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

app.get(
  '/admin',
  authenticateToken,
  authorizeRole('ADMIN'),
  (req, res) => {
    res.json({ success: true, message: 'admin ok' });
  },
);

describe('AuthMiddleware - INTEGRATION TEST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('permite acceso con token válido', async () => {
    (JWTService.validateAccessToken as jest.Mock).mockReturnValue({
      userId: '123',
      role: 'ADMIN',
    });

    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('bloquea sin token', async () => {
    const res = await request(app).get('/protected');

    expect(res.status).toBe(401);
  });

  it('bloquea rol no autorizado', async () => {
    (JWTService.validateAccessToken as jest.Mock).mockReturnValue({
      userId: '123',
      role: 'STUDENT',
    });

    const res = await request(app)
      .get('/admin')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(403);
  });

  it('permite ADMIN', async () => {
    (JWTService.validateAccessToken as jest.Mock).mockReturnValue({
      userId: '999',
      role: 'ADMIN',
    });

    const res = await request(app)
      .get('/admin')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('admin ok');
  });
});