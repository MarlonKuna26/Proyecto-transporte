// @jest-environment node
import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

jest.mock('../../src/shared/services/EmailService', () => ({
    EmailService: {
        sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
        sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    },
}));

import request from 'supertest';
import { Express } from 'express';
import { App } from '../../src/app';
import { DatabaseConnection } from '../../src/config/database';
import { createAuthRoutes } from '../../src/modules/auth/auth.routes';

let app: Express;

const TEST_USER = {
    email: `test1${Date.now()}@uta.edu.ec`,
    name: 'Heidi',
    password: 'Heidi2003',
};

beforeAll(async () => {
    await DatabaseConnection.connect();

    const instance = new App();
    instance.express.use('/api/v1/auth', createAuthRoutes());
    instance.setupErrorHandlers();
    app = instance.express;

    const pool = DatabaseConnection.getInstance();

    // 1. Limpiar datos previos
    await pool.query('DELETE FROM usuarios WHERE correo = $1', [TEST_USER.email]);
    await pool.query(
        'DELETE FROM registros_pendientes_verificacion WHERE correo = $1',
        [TEST_USER.email]
    );

    // 2. Registrar usuario (RegisterUseCase hashea la contraseña y guarda el pre-registro)
    const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send(TEST_USER);
    console.log('REGISTER status:', registerRes.status);

    if (registerRes.status !== 201 && registerRes.status !== 200) {
        throw new Error(`Registro falló: ${JSON.stringify(registerRes.body)}`);
    }

    await new Promise(resolve => setTimeout(resolve, 200));

    // 3. Leer el hash ya generado por RegisterUseCase
    const pending = await pool.query(
        `SELECT correo, nombre, contrasena_hash
         FROM registros_pendientes_verificacion
         WHERE correo = $1`,
        [TEST_USER.email]
    );

    if (pending.rows.length === 0) {
        throw new Error('No se encontró registro pendiente en la BD');
    }

    const row = pending.rows[0];

    // 4. Insertar usuario verificado directamente con los nombres de columna reales
    await pool.query(
        `INSERT INTO usuarios (correo, nombre, contrasena_hash, rol, esta_verificado, reputacion)
         VALUES ($1, $2, $3, 'STUDENT', true, 5.0)
         ON CONFLICT (correo) DO UPDATE SET esta_verificado = true`,
        [row.correo, row.nombre, row.contrasena_hash]
    );

    // 5. Crear perfil de usuario
    const userRow = await pool.query(
        'SELECT id FROM usuarios WHERE correo = $1',
        [TEST_USER.email]
    );
    const userId = userRow.rows[0]?.id;

    if (userId) {
        await pool.query(
            `INSERT INTO perfiles_usuario (usuario_id) VALUES ($1) ON CONFLICT (usuario_id) DO NOTHING`,
            [userId]
        );
    }

    // 6. Limpiar registro pendiente
    await pool.query(
        'DELETE FROM registros_pendientes_verificacion WHERE correo = $1',
        [TEST_USER.email]
    );

    // 7. Verificar login antes de correr los tests
    const loginDebug = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: TEST_USER.email, password: TEST_USER.password });
    console.log('LOGIN DEBUG status:', loginDebug.status);
    console.log('LOGIN DEBUG body:', JSON.stringify(loginDebug.body, null, 2));

    if (loginDebug.status !== 200) {
        throw new Error(`Login falló en beforeAll: ${JSON.stringify(loginDebug.body)}`);
    }
}, 30000);

afterAll(async () => {
    const pool = DatabaseConnection.getInstance();
    await pool.query('DELETE FROM usuarios WHERE correo = $1', [TEST_USER.email]);
    await pool.query(
        'DELETE FROM registros_pendientes_verificacion WHERE correo = $1',
        [TEST_USER.email]
    );
    await DatabaseConnection.disconnect();
});

describe('Login - Integración', () => {
    it('debe iniciar sesión correctamente y devolver token', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: TEST_USER.email, password: TEST_USER.password });

        console.log('LOGIN:', res.status, res.body);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const token = res.body.data?.token ?? res.body.data?.accessToken;
        expect(token).toBeDefined();

        const email =
            res.body.data?.user?.email ??
            res.body.data?.usuario?.email ??
            res.body.data?.email;

        expect(email).toBe(TEST_USER.email);
    });

    it('debe rechazar login con contraseña incorrecta', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: TEST_USER.email, password: 'incorrecta' });

        expect([401, 403]).toContain(res.status);
        expect(res.body.success).toBe(false);
    });

    it('debe rechazar login con usuario inexistente', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'noexiste@uta.edu.ec', password: TEST_USER.password });

        expect([401, 404]).toContain(res.status);
        expect(res.body.success).toBe(false);
    });

    it('debe permitir acceso a /me con JWT válido', async () => {
        const loginRes = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: TEST_USER.email, password: TEST_USER.password });

        expect(loginRes.status).toBe(200);

        const token =
            loginRes.body.data?.token ??
            loginRes.body.data?.accessToken;

        expect(token).toBeDefined();

        const res = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer ${token}`);

        console.log('ME:', res.status, res.body);
        expect(res.status).toBe(200);

        const email =
            res.body.data?.email ??
            res.body.data?.user?.email ??
            res.body.data?.usuario?.email;

        expect(email).toBe(TEST_USER.email);
    });

    it('debe rechazar acceso a /me sin token', async () => {
        const res = await request(app).get('/api/v1/auth/me');
        expect([401, 403]).toContain(res.status);
    });
});