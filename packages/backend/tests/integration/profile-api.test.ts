import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import request from 'supertest';
import express, { Express } from 'express';
import { DatabaseConnection } from '../../src/config/database';
import { createAuthRoutes } from '../../src/modules/auth/auth.routes';
import { createUserRoutes } from '../../src/modules/users/user.routes';

describe('RF-003: Profile Integration Tests', () => {
  let app: Express;
  let token: string;
  let userId: string;

  const TEST_USER = {
    email: `profile_${Date.now()}@uta.edu.ec`,
    name: 'Profile Test',
    password: 'Test1234',
  };

  beforeAll(async () => {
    const db = DatabaseConnection.getInstance();
    await DatabaseConnection.connect();

    // ========================
    // 🟢 ENSURE TABLES EXIST
    // ========================
    await db.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        correo TEXT UNIQUE NOT NULL,
        nombre TEXT NOT NULL,
        contrasena_hash TEXT NOT NULL,
        rol TEXT DEFAULT 'STUDENT',
        esta_verificado BOOLEAN DEFAULT false,
        reputacion NUMERIC DEFAULT 5,
        creado_en TIMESTAMP DEFAULT NOW(),
        actualizado_en TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS perfiles_usuario (
        usuario_id UUID PRIMARY KEY,
        phone TEXT,
        zone TEXT
      );
    `);

    // ========================
    // EXPRESS APP
    // ========================
    const expressApp = express();
    expressApp.use(express.json());

    expressApp.use('/api/v1/auth', createAuthRoutes());
    expressApp.use('/api/v1/users', createUserRoutes());

    app = expressApp;

    // ========================
    // CLEAN PREVIOUS DATA
    // ========================
    await db.query('DELETE FROM perfiles_usuario');
    await db.query('DELETE FROM usuarios');

    // ========================
    // REGISTER USER
    // ========================
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send(TEST_USER);

    if (![200, 201].includes(registerRes.status)) {
      throw new Error(`Register failed: ${JSON.stringify(registerRes.body)}`);
    }

    // ========================
    // GET USER FROM DB
    // ========================
    const userRow = await db.query(
      'SELECT id FROM usuarios WHERE correo = $1',
      [TEST_USER.email]
    );

    userId = userRow.rows[0]?.id;

    if (!userId) {
      throw new Error('User not created properly');
    }

    // ========================
    // ENSURE PROFILE EXISTS
    // ========================
    await db.query(
      `INSERT INTO perfiles_usuario (usuario_id)
       VALUES ($1)
       ON CONFLICT (usuario_id) DO NOTHING`,
      [userId]
    );

    // ========================
    // LOGIN
    // ========================
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: TEST_USER.email,
        password: TEST_USER.password,
      });

    if (loginRes.status !== 200) {
      throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
    }

    token = `Bearer ${loginRes.body.data.token}`;
  }, 30000);

  afterAll(async () => {
    const db = DatabaseConnection.getInstance();

    await db.query('DELETE FROM perfiles_usuario WHERE usuario_id = $1', [
      userId,
    ]);

    await db.query('DELETE FROM usuarios WHERE id = $1', [userId]);

    await DatabaseConnection.disconnect();
  });

  // =========================
  // TEST 1: UPDATE PROFILE
  // =========================
  test('Debe actualizar teléfono y zona y bloquear email externo', async () => {
    const res = await request(app)
      .put('/api/v1/users/profile')
      .set('Authorization', token)
      .send({
        phone: '0987654321',
        zone: 'Izamba',
        email: 'hack@gmail.com',
      });

    expect(res.status).toBe(200);

    expect(res.body.data.phone).toBe('0987654321');
    expect(res.body.data.zone).toBe('Izamba');

    // email NO debe cambiarse
    expect(res.body.data.email).toContain('@uta.edu.ec');
  });

  // =========================
  // TEST 2: GET PROFILE
  // =========================
  test('Debe cargar perfil con reputación y ratings', async () => {
    const res = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', token);

    expect(res.status).toBe(200);

    expect(res.body.data).toHaveProperty('reputation');
    expect(res.body.data).toHaveProperty('totalRatings');
  });

  // =========================
  // TEST 3: PERSISTENCIA
  // =========================
  test('Los cambios deben persistir en BD', async () => {
    await request(app)
      .put('/api/v1/users/profile')
      .set('Authorization', token)
      .send({ zone: 'Huachi Chico' });

    const res = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body.data.zone).toBe('Huachi Chico');
  });
});