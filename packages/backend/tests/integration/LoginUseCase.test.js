"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LoginUseCase_1 = require("../../src/modules/auth/application/usecases/LoginUseCase");
const LoginDTO_1 = require("../../src/modules/auth/application/dtos/LoginDTO");
const AppError_1 = require("../../src/shared/errors/AppError");
const services_1 = require("../../src/shared/services");
jest.mock('../../src/shared/services', () => ({
    JWTService: {
        generateTokenPair: jest.fn(),
    },
    PasswordService: {
        compare: jest.fn(),
    },
}));
describe('LoginUseCase', () => {
    let mockUserRepository;
    let useCase;
    beforeEach(() => {
        jest.clearAllMocks();
        mockUserRepository = {
            findByEmail: jest.fn(),
        };
        useCase = new LoginUseCase_1.LoginUseCase(mockUserRepository);
    });
    it('debería lanzar error cuando el usuario no existe', async () => {
        mockUserRepository.findByEmail.mockResolvedValue(null);
        await expect(useCase.execute(new LoginDTO_1.LoginDTO('test@test.com', '123456'))).rejects.toThrow(AppError_1.AuthenticationError);
    });
    it('debería lanzar error cuando el usuario está suspendido', async () => {
        mockUserRepository.findByEmail.mockResolvedValue({
            id: '1',
            email: 'test@test.com',
            name: 'Usuario Test',
            role: 'user',
            hashedPassword: 'hash',
            isVerified: true,
            isSuspended: true,
            suspendedUntil: new Date(Date.now() + 1000 * 60 * 60),
            suspensionReason: 'Incumplimiento de políticas',
        });
        await expect(useCase.execute(new LoginDTO_1.LoginDTO('test@test.com', '123456'))).rejects.toThrow(AppError_1.AuthenticationError);
    });
    it('debería lanzar error cuando el correo no está verificado', async () => {
        mockUserRepository.findByEmail.mockResolvedValue({
            id: '1',
            email: 'test@test.com',
            name: 'Usuario Test',
            role: 'user',
            hashedPassword: 'hash',
            isVerified: false,
            isSuspended: false,
            suspendedUntil: null,
        });
        await expect(useCase.execute(new LoginDTO_1.LoginDTO('test@test.com', '123456'))).rejects.toThrow(AppError_1.AuthenticationError);
    });
    it('debería lanzar error cuando la contraseña es incorrecta', async () => {
        mockUserRepository.findByEmail.mockResolvedValue({
            id: '1',
            email: 'test@test.com',
            name: 'Usuario Test',
            role: 'user',
            hashedPassword: 'hash',
            isVerified: true,
            isSuspended: false,
            suspendedUntil: null,
        });
        services_1.PasswordService.compare.mockResolvedValue(false);
        await expect(useCase.execute(new LoginDTO_1.LoginDTO('test@test.com', '123456'))).rejects.toThrow(AppError_1.AuthenticationError);
    });
    it('debería iniciar sesión correctamente cuando las credenciales son válidas', async () => {
        mockUserRepository.findByEmail.mockResolvedValue({
            id: '1',
            email: 'test@test.com',
            name: 'Usuario Test',
            role: 'user',
            hashedPassword: 'hash',
            isVerified: true,
            isSuspended: false,
            suspendedUntil: null,
        });
        services_1.PasswordService.compare.mockResolvedValue(true);
        services_1.JWTService.generateTokenPair.mockReturnValue({
            accessToken: 'access-token-test',
            refreshToken: 'refresh-token-test',
        });
        const result = await useCase.execute(new LoginDTO_1.LoginDTO('test@test.com', '123456'));
        expect(result).toBeDefined();
        expect(services_1.PasswordService.compare).toHaveBeenCalledTimes(1);
        expect(services_1.JWTService.generateTokenPair).toHaveBeenCalledTimes(1);
        expect(result.token).toBe('access-token-test');
        expect(result.refreshToken).toBe('refresh-token-test');
        expect(result.user.email).toBe('test@test.com');
    });
});
//# sourceMappingURL=LoginUseCase.test.js.map