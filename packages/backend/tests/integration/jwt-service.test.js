"use strict";
// tests/integration/jwt-service.test.ts
Object.defineProperty(exports, "__esModule", { value: true });
const JWTService_1 = require("../../src/shared/services/JWTService");
describe('JWTService Integration', () => {
    const payload = {
        userId: '123',
        email: 'test@uta.edu.ec',
        role: 'STUDENT',
    };
    it('debe generar y validar access y refresh token', () => {
        const tokens = JWTService_1.JWTService.generateTokenPair(payload);
        expect(tokens.accessToken).toBeDefined();
        expect(tokens.refreshToken).toBeDefined();
        const accessDecoded = JWTService_1.JWTService.validateAccessToken(tokens.accessToken);
        const refreshDecoded = JWTService_1.JWTService.validateRefreshToken(tokens.refreshToken);
        expect(accessDecoded.userId).toBe(payload.userId);
        expect(accessDecoded.email).toBe(payload.email);
        expect(refreshDecoded.userId).toBe(payload.userId);
        expect(refreshDecoded.email).toBe(payload.email);
    });
    it('debe generar un nuevo access token', () => {
        const token = JWTService_1.JWTService.generateAccessToken(payload);
        const decoded = JWTService_1.JWTService.validateAccessToken(token);
        expect(decoded.userId).toBe(payload.userId);
    });
    it('debe decodificar un token', () => {
        const token = JWTService_1.JWTService.generateAccessToken(payload);
        const decoded = JWTService_1.JWTService.decode(token);
        expect(decoded).not.toBeNull();
        expect(decoded?.email).toBe(payload.email);
    });
    it('debe lanzar error con access token inválido', () => {
        expect(() => JWTService_1.JWTService.validateAccessToken('token-falso')).toThrow('Token de acceso inválido o expirado');
    });
    it('debe lanzar error con refresh token inválido', () => {
        expect(() => JWTService_1.JWTService.validateRefreshToken('token-falso')).toThrow('Token de actualización inválido o expirado');
    });
    it('debe retornar null al decodificar token inválido', () => {
        const decoded = JWTService_1.JWTService.decode('token-falso');
        expect(decoded).toBeNull();
    });
});
//# sourceMappingURL=jwt-service.test.js.map