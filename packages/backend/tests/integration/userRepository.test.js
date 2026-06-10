"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UserRepository_1 = require("../../src/modules/auth/infrastructure/repositories/UserRepository");
const database_1 = require("../../src/config/database");
const uuid_1 = require("uuid");
describe('UserRepository Integration Tests', () => {
    const db = database_1.DatabaseConnection.getInstance();
    const repo = new UserRepository_1.UserRepository();
    let userId;
    beforeAll(async () => {
        await db.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id UUID PRIMARY KEY,
        correo TEXT UNIQUE NOT NULL,
        nombre TEXT NOT NULL,
        contrasena_hash TEXT NOT NULL,
        rol TEXT NOT NULL,
        esta_verificado BOOLEAN DEFAULT FALSE,
        reputacion INT DEFAULT 0,
        creado_en TIMESTAMP DEFAULT NOW(),
        actualizado_en TIMESTAMP DEFAULT NOW(),
        esta_suspendido BOOLEAN DEFAULT FALSE,
        motivo_suspension TEXT,
        suspendido_hasta TIMESTAMP
      );
    `);
    });
    beforeEach(async () => {
        userId = (0, uuid_1.v4)();
        await db.query(`
      INSERT INTO usuarios (
        id, correo, nombre, contrasena_hash, rol,
        esta_verificado, reputacion, creado_en, actualizado_en
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
      `, [
            userId,
            'test@uta.edu.ec',
            'Usuario Test',
            'hash123',
            'STUDENT',
            true,
            5,
        ]);
    });
    afterEach(async () => {
        await db.query('DELETE FROM usuarios;');
    });
    afterAll(async () => {
        await db.query('DROP TABLE IF EXISTS usuarios CASCADE;');
    });
    it('crear usuario correctamente', async () => {
        const newUser = await repo.create({
            id: (0, uuid_1.v4)(),
            email: 'nuevo@uta.edu.ec',
            name: 'Nuevo Usuario',
            hashedPassword: 'hash456',
            role: 'STUDENT',
            isVerified: false,
            reputation: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        expect(newUser.email).toBe('nuevo@uta.edu.ec');
    });
    it('buscar usuario por email', async () => {
        const user = await repo.findByEmail('test@uta.edu.ec');
        expect(user).not.toBeNull();
        expect(user.email).toBe('test@uta.edu.ec');
    });
    it('buscar usuario por id', async () => {
        const user = await repo.findById(userId);
        expect(user).not.toBeNull();
        expect(user.id).toBe(userId);
    });
    it('actualizar usuario', async () => {
        const updated = await repo.update(userId, {
            name: 'Usuario Actualizado',
            isVerified: false,
        });
        expect(updated.name).toBe('Usuario Actualizado');
        expect(updated.isVerified).toBe(false);
    });
    it('listar todos los usuarios', async () => {
        const users = await repo.findAll();
        expect(users.length).toBeGreaterThan(0);
    });
    it('eliminar usuario', async () => {
        await repo.delete(userId);
        const user = await repo.findById(userId);
        expect(user).toBeNull();
    });
});
//# sourceMappingURL=userRepository.test.js.map