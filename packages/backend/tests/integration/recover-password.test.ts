// Prueba de integración para la ruta `/api/v1/auth/forgot-password`.
// Objetivo: comprobar que la API genera un código de recuperación, guarda su
// valor en la base de datos y llama al servicio de envío de correo. En modo
// desarrollo (`EMAIL_DEV_MODE=true`) la respuesta incluye el código para facilitar
// las comprobaciones desde las pruebas.
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { App } from '@/app';
import { createAuthRoutes } from '@/modules/auth/auth.routes';
import { DatabaseConnection } from '@/config/database';
import { EmailService } from '@/shared/services/EmailService';

jest.setTimeout(20000);

describe('RequestPasswordReset - integración', () => {
	// Preparar entorno de prueba: activar modo dev (para recibir el código) y
	// conectar a la base de datos de integración.
	beforeAll(async () => {
		process.env.EMAIL_DEV_MODE = 'true';
		process.env.FRONTEND_URL = 'http://test-frontend';
		await DatabaseConnection.connect();
	});

	// Desconectar y limpiar variables de entorno una vez finalizados los tests.
	afterAll(async () => {
		await DatabaseConnection.disconnect();
		delete process.env.EMAIL_DEV_MODE;
		delete process.env.FRONTEND_URL;
	});

	// Limpiar registros creados por la prueba para dejar la BD en estado limpio.
	afterEach(async () => {
		const pool = DatabaseConnection.getInstance();
		await pool.query('DELETE FROM recuperaciones_contrasena WHERE correo = $1', ['user@example.com']);
		await pool.query('DELETE FROM usuarios WHERE correo = $1', ['user@example.com']);
	});

	it('genera código, guarda en BD y envía email (dev mode devuelve código)', async () => {
		const pool = DatabaseConnection.getInstance();

		// Insertar usuario de prueba en la tabla `usuarios`.
		const userId = uuidv4();
		await pool.query(
			`INSERT INTO usuarios (id, correo, nombre, contrasena_hash, rol, esta_verificado, reputacion)
			 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
			[userId, 'user@example.com', 'Test User', 'hashed_password', 'STUDENT', true, 5.0],
		);

		// Espiar el envío de correo para evitar enviar emails reales durante la prueba.
		const emailSpy = jest.spyOn(EmailService, 'sendPasswordResetCode').mockImplementation(async () => {});

		// Montar la app con las rutas de autenticación (no arrancamos un servidor HTTP real).
		const app = new App();
		app.express.use('/api/v1/auth', createAuthRoutes());
		app.setupErrorHandlers();

		// Llamar al endpoint con email en mayúsculas/espacios para comprobar normalización.
		const res = await request(app.express)
			.post('/api/v1/auth/forgot-password')
			.send({ email: ' USER@Example.COM ' })
			.expect(200);

		// Comprobar respuesta y que el código devuelto (modo dev) cumple formato esperado.
		expect(res.body.success).toBe(true);
		const data = res.body.data;
		expect(data.requested).toBe(true);
		expect(data.expiresInMinutes).toBe(15);
		expect(data.code).toBeDefined();
		expect(typeof data.code).toBe('string');
		expect((data.code as string).length).toBe(6);

		// Verificar que la base de datos guardó el código.
		const dbRes = await pool.query('SELECT * FROM recuperaciones_contrasena WHERE correo = $1', ['user@example.com']);
		expect(dbRes.rows.length).toBe(1);
		const row = dbRes.rows[0];

		expect(row.codigo).toBe(data.code);
		expect(new Date(row.expira_en) instanceof Date).toBeTruthy();

		// Verificar que se llamó al servicio de email con el código correcto.
		expect(emailSpy).toHaveBeenCalledWith('user@example.com', data.code);

		emailSpy.mockRestore();
	});
});
