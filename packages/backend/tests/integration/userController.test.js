"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const UserController_1 = require("../../src/modules/users/infrastructure/controllers/UserController");
describe('UserController Integration Tests', () => {
    let app;
    let mockGetProfile;
    let mockUpdateProfile;
    let mockCreateVehicle;
    let mockGetVehicles;
    let mockDeleteVehicle;
    let mockUpdateVehicle;
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetProfile = { execute: jest.fn() };
        mockUpdateProfile = { execute: jest.fn() };
        mockCreateVehicle = { execute: jest.fn() };
        mockGetVehicles = { execute: jest.fn() };
        mockDeleteVehicle = { execute: jest.fn() };
        mockUpdateVehicle = { execute: jest.fn() };
        const controller = new UserController_1.UserController(mockGetProfile, mockUpdateProfile, mockCreateVehicle, mockGetVehicles, mockDeleteVehicle, mockUpdateVehicle);
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        // mock auth middleware
        app.use((req, _res, next) => {
            req.user = { userId: 'user-1' };
            next();
        });
        app.get('/profile/:userId', (req, res) => controller.getProfile(req, res));
        app.put('/profile', (req, res) => controller.updateProfile(req, res));
        app.post('/vehicle', (req, res) => controller.createVehicle(req, res));
        app.get('/vehicles', (req, res) => controller.getMyVehicles(req, res));
        app.delete('/vehicle/:vehicleId', (req, res) => controller.deleteVehicle(req, res));
        app.put('/vehicle/:vehicleId', (req, res) => controller.updateVehicle(req, res));
    });
    // ================= PROFILE =================
    it('GET /profile/:userId - success', async () => {
        mockGetProfile.execute.mockResolvedValue({
            userId: 'user-1',
            email: 'test@uta.edu.ec',
        });
        const res = await (0, supertest_1.default)(app).get('/profile/user-1');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
    it('PUT /profile - success', async () => {
        mockUpdateProfile.execute.mockResolvedValue({
            userId: 'user-1',
            updated: true,
        });
        const res = await (0, supertest_1.default)(app).put('/profile').send({
            career: 'Engineering',
        });
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Profile updated');
    });
    // ================= VEHICLES =================
    it('POST /vehicle - success', async () => {
        mockCreateVehicle.execute.mockResolvedValue({
            id: '1',
            plate: 'ABC-123',
        });
        const res = await (0, supertest_1.default)(app).post('/vehicle').send({
            plate: 'ABC-123',
            brand: 'Toyota',
            model: 'Corolla',
            color: 'Red',
            capacity: 4,
        });
        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Vehicle created');
    });
    it('GET /vehicles - success', async () => {
        mockGetVehicles.execute.mockResolvedValue([
            { id: '1' },
            { id: '2' },
        ]);
        const res = await (0, supertest_1.default)(app).get('/vehicles');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
    it('DELETE /vehicle/:vehicleId - success', async () => {
        mockDeleteVehicle.execute.mockResolvedValue(undefined);
        const res = await (0, supertest_1.default)(app).delete('/vehicle/1');
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Vehicle deleted');
    });
    it('PUT /vehicle/:vehicleId - success', async () => {
        mockUpdateVehicle.execute.mockResolvedValue({
            id: '1',
            plate: 'XYZ-999',
        });
        const res = await (0, supertest_1.default)(app)
            .put('/vehicle/1')
            .send({
            plate: 'XYZ-999',
        });
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Vehicle updated');
    });
    // ================= VALIDATION =================
    it('DELETE /vehicle - missing id', async () => {
        const res = await (0, supertest_1.default)(app).delete('/vehicle/');
        expect(res.status).toBe(404);
    });
    it('PUT /vehicle - missing id', async () => {
        const res = await (0, supertest_1.default)(app).put('/vehicle/').send({});
        expect(res.status).toBe(404);
    });
});
//# sourceMappingURL=userController.test.js.map