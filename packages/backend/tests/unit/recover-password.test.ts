
// Pruebas unitarias para `RequestPasswordResetUseCase`.
// Objetivo: verificar el comportamiento de la generación de token y el manejo seguro.
// Casos principales:
// - Cuando el correo no existe: no revelar la existencia y no enviar email.
// - Cuando el correo existe: generar token, almacenar hash y enviar email
//   (en `EMAIL_DEV_MODE` la función devuelve el token en la respuesta para facilitar pruebas).
import crypto from 'crypto';
import { RequestPasswordResetUseCase } from '../../src/modules/auth/application/usecases/RequestPasswordResetUseCase';
import { DatabaseConnection } from '../../src/config/database';
import { EmailService } from '../../src/shared/services/EmailService';

describe('RequestPasswordResetUseCase - generación de token', () => {
	// Restaurar mocks entre tests para evitar efectos colaterales
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	// Limpiar entorno y mocks al terminar cada test
	afterEach(() => {
		jest.restoreAllMocks();
		delete process.env.EMAIL_DEV_MODE;
		delete process.env.FRONTEND_URL;
	});

	// Caso: correo no registrado -> la API/UseCase debe indicar que se procesó
	// la petición sin revelar si el usuario existe y sin enviar ningún email.
	it('no revela si el correo existe y no envía email para correo no registrado', async () => {
		const mockPool = { query: jest.fn().mockResolvedValue({ rows: [] }) } as any;
		const dbSpy = jest.spyOn(DatabaseConnection, 'getInstance').mockReturnValue(mockPool);

		const mockUserRepo = { findByEmail: jest.fn().mockResolvedValue(null) } as any;
		const emailSpy = jest.spyOn(EmailService, 'sendPasswordResetEmail').mockImplementation(async () => {});

		const usecase = new RequestPasswordResetUseCase(mockUserRepo);
		const result = await usecase.execute({ email: '  NotFound@Example.COM ' });

		expect(result.requested).toBe(true);
		expect(result.expiresInMinutes).toBe(15);

		// Sólo debe haberse ejecutado la creación de tabla (CREATE TABLE)
		const createTableCall = mockPool.query.mock.calls.find((c: any) =>
			typeof c[0] === 'string' && c[0].includes('CREATE TABLE IF NOT EXISTS recuperaciones_contrasena'),
		);
		expect(createTableCall).toBeDefined();

		// No debe insertarse ni actualizarse ningún token
		const insertCalls = mockPool.query.mock.calls.filter((c: any) =>
			typeof c[0] === 'string' && c[0].includes('INSERT INTO recuperaciones_contrasena'),
		);
		expect(insertCalls.length).toBe(0);

		expect(emailSpy).not.toHaveBeenCalled();

		dbSpy.mockRestore();
		emailSpy.mockRestore();
	});

	// Caso: correo registrado -> debe generarse un token, almacenarse su hash
	// en la tabla de recuperaciones y llamarse al servicio de email. En
	// `EMAIL_DEV_MODE` el resultado incluye el token para facilitar la comprobación.
	it('genera token, guarda hash y envía email; en dev mode devuelve token', async () => {
		process.env.EMAIL_DEV_MODE = 'true';
		process.env.FRONTEND_URL = 'http://test-frontend';

		const mockPool = { query: jest.fn().mockResolvedValue({ rows: [] }) } as any;
		const dbSpy = jest.spyOn(DatabaseConnection, 'getInstance').mockReturnValue(mockPool);

		const user = { id: 'u-1', email: 'user@example.com' } as any;
		const mockUserRepo = { findByEmail: jest.fn().mockResolvedValue(user) } as any;

		const emailSpy = jest.spyOn(EmailService, 'sendPasswordResetEmail').mockImplementation(async () => {});

		const usecase = new RequestPasswordResetUseCase(mockUserRepo);
		const result = await usecase.execute({ email: ' USER@Example.COM ' });

		expect(result.requested).toBe(true);
		expect(result.expiresInMinutes).toBe(15);
		expect((result as any).resetToken).toBeDefined();
		expect(((result as any).resetToken as string).length).toBe(6);

		// Buscar llamada INSERT y verificar parámetros
		const insertCall = mockPool.query.mock.calls.find((c: any) =>
			typeof c[0] === 'string' && c[0].includes('INSERT INTO recuperaciones_contrasena'),
		);
		expect(insertCall).toBeDefined();

		const params = insertCall[1];
		expect(params[0]).toBe('user@example.com'); // email normalizado

		const resetToken = (result as any).resetToken as string;
		const expectedHash = crypto.createHash('sha256').update(resetToken).digest('hex');
		expect(params[1]).toBe(expectedHash); // token almacenado es hash

		expect(params[2]).toBeInstanceOf(Date); // expira_en es Date

		// Verificar que se haya enviado el correo con la URL que contiene el token
		expect(emailSpy).toHaveBeenCalledWith('user@example.com', expect.stringContaining(`token=${resetToken}`));

		dbSpy.mockRestore();
		emailSpy.mockRestore();
	});
});

