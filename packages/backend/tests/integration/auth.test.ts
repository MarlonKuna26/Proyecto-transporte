import express from 'express';
import request from 'supertest';
import { AuthController } from '../../src/modules/auth/infrastructure/controllers/AuthController';

describe('AuthController Integration Tests', () => {
  let app: express.Express;

  let mockLoginUseCase: any;
  let mockRegisterUseCase: any;
  let mockVerifyEmailUseCase: any;
  let mockRequestPasswordResetUseCase: any;
  let mockResetPasswordUseCase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLoginUseCase = { execute: jest.fn() };
    mockRegisterUseCase = { execute: jest.fn() };
    mockVerifyEmailUseCase = { execute: jest.fn() };
    mockRequestPasswordResetUseCase = { execute: jest.fn() };
    mockResetPasswordUseCase = { execute: jest.fn() };

    const controller = new AuthController(
      mockLoginUseCase,
      mockRegisterUseCase,
      mockVerifyEmailUseCase,
      mockRequestPasswordResetUseCase,
      mockResetPasswordUseCase,
    );

    app = express();
    app.use(express.json());

    app.post('/auth/register', (req, res) => controller.register(req, res));
    app.post('/auth/login', (req, res) => controller.login(req, res));
    app.post('/auth/verify', (req, res) => controller.verifyEmail(req, res));
  });

  it('POST /auth/register - success', async () => {
    mockRegisterUseCase.execute.mockResolvedValue({
      id: 1,
      email: 'test@uta.edu.ec',
    });

    const res = await request(app)
      .post('/auth/register')
      .send({
        email: 'test@uta.edu.ec',
        name: 'test',
        password: 'Abc12345',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(mockRegisterUseCase.execute).toHaveBeenCalled();
  });

  it('POST /auth/login - success', async () => {
    mockLoginUseCase.execute.mockResolvedValue({
      token: 'jwt-token',
    });

    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@uta.edu.ec',
        password: 'Abc12345',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockLoginUseCase.execute).toHaveBeenCalled();
  });

  it('POST /auth/verify - success', async () => {
    mockVerifyEmailUseCase.execute.mockResolvedValue({
      verified: true,
      message: 'ok',
    });

    const res = await request(app)
      .post('/auth/verify')
      .send({
        email: 'test@uta.edu.ec',
        code: '123456',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /auth/register - validation error', async () => {
    const res = await request(app).post('/auth/register').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /auth/login - validation error', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@uta.edu.ec' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});