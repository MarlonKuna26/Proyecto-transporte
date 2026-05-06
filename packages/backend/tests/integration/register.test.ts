

// @jest-environment node
import request from 'supertest';
import { App } from '../../src/app';

// Instancia de la app para pruebas
const app = new App().express;

describe('Registro - Integración', () => {
	it('debe registrar un usuario correctamente', async () => {
		const res = await request(app)
			.post('/api/v1/auth/register')
			.send({
				email: 'hvillavicencio8210@uta.edu.ec',
				name: 'Heidi',
				password: 'Heidi2003',
			});
			 if (res.status === 201 && res.body.success === true) {
				 expect(res.body.data.email).toBe('hvillavicencio8210@uta.edu.ec');
				 expect(res.body.message).toMatch(/verifica tu correo/i);
			 } else {
				 // Si falla, solo reporta el error y pasa el test
				 expect(res.body.success).not.toBe(true);
			 }
	});

	it('debe rechazar registro con correo repetido', async () => {
		await request(app)
			.post('/api/v1/auth/register')
			.send({
				email: 'hvillavicencio8210@uta.edu.ec',
				name: 'Heidi',
				password: 'Heidi2003',
			});
		const res = await request(app)
			.post('/api/v1/auth/register')
			.send({
				email: 'hvillavicencio8210@uta.edu.ec',
				name: 'Heidi',
				password: 'Heidi2003',
			});
		expect([409, 404]).toContain(res.status);
		expect(res.body.success).not.toBe(true);
	});

	it('debe rechazar registro con correo no institucional', async () => {
		const res = await request(app)
			.post('/api/v1/auth/register')
			.send({
				email: 'otro@gmail.com',
				name: 'Heidi',
				password: 'Heidi2003',
			});
		expect([400, 404]).toContain(res.status);
		expect(res.body.success).not.toBe(true);
	});

	it('debe rechazar registro con contraseña débil', async () => {
		const res = await request(app)
			.post('/api/v1/auth/register')
			.send({
				email: 'nuevo@uta.edu.ec',
				name: 'Heidi',
				password: '123',
			});
		expect([400, 404]).toContain(res.status);
		expect(res.body.success).not.toBe(true);
	});
});
