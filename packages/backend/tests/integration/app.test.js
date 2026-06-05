"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const AuthMiddleware_1 = require("../../src/shared/middlewares/AuthMiddleware");
const services_1 = require("@shared/services");
jest.mock('@shared/services', () => ({
    JWTService: {
        validateAccessToken: jest.fn(),
    },
}));
const app = (0, express_1.default)();
// rutas reales
app.get('/protected', AuthMiddleware_1.authenticateToken, (req, res) => {
    res.json({ success: true, user: req.user });
});
app.get('/admin', AuthMiddleware_1.authenticateToken, (0, AuthMiddleware_1.authorizeRole)('ADMIN'), (req, res) => {
    res.json({ success: true, message: 'admin ok' });
});
describe('AuthMiddleware - INTEGRATION TEST', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('permite acceso con token válido', async () => {
        services_1.JWTService.validateAccessToken.mockReturnValue({
            userId: '123',
            role: 'ADMIN',
        });
        const res = await (0, supertest_1.default)(app)
            .get('/protected')
            .set('Authorization', 'Bearer token');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
    it('bloquea sin token', async () => {
        const res = await (0, supertest_1.default)(app).get('/protected');
        expect(res.status).toBe(401);
    });
    it('bloquea rol no autorizado', async () => {
        services_1.JWTService.validateAccessToken.mockReturnValue({
            userId: '123',
            role: 'STUDENT',
        });
        const res = await (0, supertest_1.default)(app)
            .get('/admin')
            .set('Authorization', 'Bearer token');
        expect(res.status).toBe(403);
    });
    it('permite ADMIN', async () => {
        services_1.JWTService.validateAccessToken.mockReturnValue({
            userId: '999',
            role: 'ADMIN',
        });
        const res = await (0, supertest_1.default)(app)
            .get('/admin')
            .set('Authorization', 'Bearer token');
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('admin ok');
    });
});
//# sourceMappingURL=app.test.js.map