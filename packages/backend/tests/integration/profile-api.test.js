"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const database_1 = require("../../src/config/database");
const auth_routes_1 = require("../../src/modules/auth/auth.routes");
const user_routes_1 = require("../../src/modules/users/user.routes");
describe('RF-003: Profile Integration Tests', () => {
    let app;
    let token;
    let userId;
    const TEST_USER = {
        email: `profile_${Date.now()}@uta.edu.ec`,
        name: 'Profile Test',
        password: 'Test1234',
    };
    beforeAll(async () => {
        const db = database_1.DatabaseConnection.getInstance();
        await database_1.DatabaseConnection.connect();
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
        const expressApp = (0, express_1.default)();
        expressApp.use(express_1.default.json());
        expressApp.use('/api/v1/auth', (0, auth_routes_1.createAuthRoutes)());
        expressApp.use('/api/v1/users', (0, user_routes_1.createUserRoutes)());
        app = expressApp;
        // ========================
        // CLEAN PREVIOUS DATA
        // ========================
        await db.query('DELETE FROM perfiles_usuario');
        await db.query('DELETE FROM usuarios');
        // ========================
        // REGISTER USER
        // ========================
        const registerRes = await (0, supertest_1.default)(app)
            .post('/api/v1/auth/register')
            .send(TEST_USER);
        if (![200, 201].includes(registerRes.status)) {
            throw new Error(`Register failed: ${JSON.stringify(registerRes.body)}`);
        }
        // ========================
        // GET USER FROM DB
        // ========================
        const userRow = await db.query('SELECT id FROM usuarios WHERE correo = $1', [TEST_USER.email]);
        userId = userRow.rows[0]?.id;
        if (!userId) {
            throw new Error('User not created properly');
        }
        // ========================
        // ENSURE PROFILE EXISTS
        // ========================
        await db.query(`INSERT INTO perfiles_usuario (usuario_id)
       VALUES ($1)
       ON CONFLICT (usuario_id) DO NOTHING`, [userId]);
        // ========================
        // LOGIN
        // ========================
        const loginRes = await (0, supertest_1.default)(app)
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
        const db = database_1.DatabaseConnection.getInstance();
        await db.query('DELETE FROM perfiles_usuario WHERE usuario_id = $1', [
            userId,
        ]);
        await db.query('DELETE FROM usuarios WHERE id = $1', [userId]);
        await database_1.DatabaseConnection.disconnect();
    });
    // =========================
    // TEST 1: UPDATE PROFILE
    // =========================
    test('Debe actualizar teléfono y zona y bloquear email externo', async () => {
        const res = await (0, supertest_1.default)(app)
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
        const res = await (0, supertest_1.default)(app)
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
        await (0, supertest_1.default)(app)
            .put('/api/v1/users/profile')
            .set('Authorization', token)
            .send({ zone: 'Huachi Chico' });
        const res = await (0, supertest_1.default)(app)
            .get('/api/v1/users/profile')
            .set('Authorization', token);
        expect(res.status).toBe(200);
        expect(res.body.data.zone).toBe('Huachi Chico');
    });
});
//# sourceMappingURL=profile-api.test.js.map