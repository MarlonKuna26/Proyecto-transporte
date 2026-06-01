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
import express, { Express } from 'express';
import { App } from '../../src/app';
import { DatabaseConnection } from '../../src/config/database';
import { createAuthRoutes } from '../../src/modules/auth/auth.routes';
import { createUserRoutes } from '../../src/modules/users/user.routes';

describe('RF-003: Gestión de Perfil de Usuario (Pruebas de Integración)', () => {
    let app: Express;
    let tokenDePrueba = '';
    const TEST_USER = {
        email: `profiletest${Date.now()}@uta.edu.ec`,
        name: 'Profile Tester',
        password: 'Test1234',
    };

    beforeAll(async () => {
        await DatabaseConnection.connect();

        // Crear una app Express mínima en el test para controlar el orden
        // de montaje: body parser primero, luego rutas (sin handlers 404 previos).
        const expressApp = express();
        expressApp.use(express.json({ limit: '5mb' }));
        expressApp.use('/api/v1/auth', createAuthRoutes());
        expressApp.use('/api/v1/users', createUserRoutes());
        app = expressApp;

        // Debug: listar rutas registradas para verificar que /api/v1/users/profile esté montada
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stack: any[] = (app as any)._router?.stack || [];
        console.log('--- Registered routes (debug) ---');
        stack.forEach((layer: any) => {
            const prefix = layer.regexp ? layer.regexp.toString() : '<no-regexp>';
            if (layer.route && layer.route.path) {
                console.log('route:', layer.route.path, Object.keys(layer.route.methods), 'prefix:', prefix);
            } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
                console.log('router layer prefix:', prefix);
                layer.handle.stack.forEach((s: any) => {
                    if (s.route) console.log('  ->', s.route.path, Object.keys(s.route.methods));
                });
            }
        });

        const pool = DatabaseConnection.getInstance();

        // Limpiar si existe
        await pool.query('DELETE FROM registros_pendientes_verificacion WHERE correo = $1', [TEST_USER.email]);
        await pool.query('DELETE FROM usuarios WHERE correo = $1', [TEST_USER.email]);

        // Registrar usuario (usa la ruta pública)
        const registerRes = await request(app)
            .post('/api/v1/auth/register')
            .send(TEST_USER);

        if (![200, 201].includes(registerRes.status)) {
            throw new Error(`Registro falló en beforeAll: ${JSON.stringify(registerRes.body)}`);
        }

        // Espera breve para que RegisterUseCase persista el pre-registro
        await new Promise(resolve => setTimeout(resolve, 200));

        // Obtener hash del pre-registro y promover al usuario verificado
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

        await pool.query(
            `INSERT INTO usuarios (correo, nombre, contrasena_hash, rol, esta_verificado, reputacion)
             VALUES ($1, $2, $3, 'STUDENT', true, 5.0)
             ON CONFLICT (correo) DO UPDATE SET esta_verificado = true`,
            [row.correo, row.nombre, row.contrasena_hash]
        );

        const userRow = await pool.query('SELECT id FROM usuarios WHERE correo = $1', [TEST_USER.email]);
        const userId = userRow.rows[0]?.id;
        if (userId) {
            await pool.query(
                `INSERT INTO perfiles_usuario (usuario_id) VALUES ($1) ON CONFLICT (usuario_id) DO NOTHING`,
                [userId]
            );
        }

        await pool.query('DELETE FROM registros_pendientes_verificacion WHERE correo = $1', [TEST_USER.email]);

        // Login para obtener token
        const loginRes = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: TEST_USER.email, password: TEST_USER.password });

        if (loginRes.status !== 200) {
            throw new Error(`Login falló en beforeAll: ${JSON.stringify(loginRes.body)}`);
        }
        tokenDePrueba = `Bearer ${loginRes.body.data.token}`;
    }, 30000);

    afterAll(async () => {
        const pool = DatabaseConnection.getInstance();
        await pool.query('DELETE FROM usuarios WHERE correo = $1', [TEST_USER.email]);
        await pool.query('DELETE FROM registros_pendientes_verificacion WHERE correo = $1', [TEST_USER.email]);
        await DatabaseConnection.disconnect();
    });

    test('CF-RF003: Debe actualizar teléfono y zona, pero bloquear el correo institucional', async () => {
        const payload = { phone: '0987654321', zone: 'Izamba', email: 'hacker@gmail.com' };

        const res = await request(app)
            .put('/api/v1/users/profile')
            .set('Authorization', tokenDePrueba)
            .send(payload);
        console.log('DEBUG PUT /api/v1/users/profile ->', res.status, res.body);
        expect(res.status).toBe(200);
        const perfilActualizado = res.body.data;
        expect(perfilActualizado.phone).toBe('0987654321');
        expect(perfilActualizado.zone).toBe('Izamba');
        expect(perfilActualizado.email).not.toBe('hacker@gmail.com');
        expect(perfilActualizado.email).toContain('@uta.edu.ec');
    });

    test('CF-RF003-03: El perfil debe cargar el historial de viajes y la calificación', async () => {
        const res = await request(app)
            .get('/api/v1/users/profile')
            .set('Authorization', tokenDePrueba);
        console.log('DEBUG GET /api/v1/users/profile ->', res.status, res.body);
        expect(res.status).toBe(200);
        const perfil = res.body.data;
        expect(perfil).toHaveProperty('totalRatings');
        expect(perfil).toHaveProperty('reputation');
    });

    test('Enfoque Técnico: Los cambios deben mantenerse al recargar la página (Lectura DB)', async () => {
        await request(app)
            .put('/api/v1/users/profile')
            .set('Authorization', tokenDePrueba)
            .send({ zone: 'Huachi Chico' });

        const res = await request(app)
            .get('/api/v1/users/profile')
            .set('Authorization', tokenDePrueba);
        console.log('DEBUG GET after PUT /api/v1/users/profile ->', res.status, res.body);
        expect(res.status).toBe(200);
        expect(res.body.data.zone).toBe('Huachi Chico');
    });
});