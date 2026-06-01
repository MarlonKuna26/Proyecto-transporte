"use strict";
/// <reference types="jest" />
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../src/app"));
const database_1 = require("../../src/config/database");
// Mock del servicio de email (para no enviar correos reales)
jest.mock('../../src/shared/services/EmailService', () => ({
    EmailService: {
        sendVerificationEmail: jest.fn().mockResolvedValue(true)
    }
}));
describe('Register Integration (API)', () => {
    let db;
    beforeAll(() => {
        db = database_1.DatabaseConnection.getInstance();
    });
    beforeEach(async () => {
        await db.query('DELETE FROM registros_pendientes_verificacion');
        await db.query('DELETE FROM usuarios');
    });
    afterAll(async () => {
        // ✅ cerrar conexión correctamente (evita open handles)
        await db.end();
        // ✅ pequeña espera para cierre limpio en Jest
        await new Promise(resolve => setTimeout(resolve, 100));
    });
    it('registra usuario correctamente', async () => {
        const response = await (0, supertest_1.default)(app_1.default)
            .post('/auth/register')
            .send({
            email: 'vsarco7769@uta.edu.ec',
            name: 'Viviana',
            password: 'Password1'
        });
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('pendingVerification', true);
        expect(response.body.data).toHaveProperty('expiresInMinutes', 30);
    });
    it('rechaza correo no institucional', async () => {
        const response = await (0, supertest_1.default)(app_1.default)
            .post('/auth/register')
            .send({
            email: 'test@gmail.com',
            name: 'Viviana',
            password: 'Password1'
        });
        expect(response.status).toBe(400);
    });
    it('rechaza usuario ya existente', async () => {
        await db.query(`INSERT INTO usuarios (correo, nombre, contrasena_hash)
       VALUES ($1, $2, $3)`, ['test@uta.edu.ec', 'Viviana', 'hashed_password']);
        const response = await (0, supertest_1.default)(app_1.default)
            .post('/auth/register')
            .send({
            email: 'test@uta.edu.ec',
            name: 'Viviana',
            password: 'Password1'
        });
        expect(response.status).toBe(409);
    });
    it('guarda registro en tabla de pendientes', async () => {
        await (0, supertest_1.default)(app_1.default)
            .post('/auth/register')
            .send({
            email: 'test@uta.edu.ec',
            name: 'Viviana',
            password: 'Password1'
        });
        const result = await db.query(`SELECT * 
       FROM registros_pendientes_verificacion 
       WHERE correo = $1`, ['test@uta.edu.ec']);
        expect(result.rows.length).toBe(1);
    });
});
//# sourceMappingURL=register.test.js.map