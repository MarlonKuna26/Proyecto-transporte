"use strict";
// login.test.ts - contenido pendiente
Object.defineProperty(exports, "__esModule", { value: true });
const LoginUseCase_1 = require("../../src/modules/auth/application/usecases/LoginUseCase");
const LoginDTO_1 = require("../../src/modules/auth/application/dtos/LoginDTO");
describe('LoginUseCase', () => {
    let userRepositoryMock;
    let useCase;
    beforeEach(() => {
        userRepositoryMock = {
            findByEmail: jest.fn(),
        };
        useCase = new LoginUseCase_1.LoginUseCase(userRepositoryMock);
    });
    it('debe iniciar sesión correctamente', async () => {
        userRepositoryMock.findByEmail.mockResolvedValue({
            id: '1',
            email: 'hvillavicencio8210@uta.edu.ec',
            hashedPassword: 'hash123',
            isVerified: true,
            role: 'STUDENT',
            name: 'Heidi',
        });
        jest
            .spyOn(require('../../src/shared/services/PasswordService').PasswordService, 'compare')
            .mockResolvedValue(true);
        jest
            .spyOn(require('../../src/shared/services/JWTService').JWTService, 'generateTokenPair')
            .mockReturnValue({
            accessToken: 'token',
            refreshToken: 'refresh',
        });
        const input = new LoginDTO_1.LoginDTO('hvillavicencio8210@uta.edu.ec', 'Heidi2003');
        const result = await useCase.execute(input);
        expect(result.token || result.token).toBeDefined();
        expect(result.refreshToken).toBeDefined();
        expect(result.user?.id || result.user.id).toBeDefined();
    });
    it('debe fallar si el usuario no existe', async () => {
        userRepositoryMock.findByEmail.mockResolvedValue(null);
        const input = new LoginDTO_1.LoginDTO('hvillavicencio8210@uta.edu.ec', 'Heidi2003');
        await expect(useCase.execute(input)).rejects.toThrow('Correo o contraseña inválidos');
    });
    it('debe bloquear si el usuario no está verificado', async () => {
        userRepositoryMock.findByEmail.mockResolvedValue({
            id: '1',
            email: 'hvillavicencio8210@uta.edu.ec',
            hashedPassword: 'hash123',
            isVerified: false,
            role: 'STUDENT',
            name: 'Heidi',
        });
        const input = new LoginDTO_1.LoginDTO('hvillavicencio8210@uta.edu.ec', 'Heidi2003');
        await expect(useCase.execute(input)).rejects.toThrow('Email not verified. Please check your inbox.');
    });
    it('debe bloquear tras contraseña incorrecta', async () => {
        userRepositoryMock.findByEmail.mockResolvedValue({
            id: '1',
            email: 'hvillavicencio8210@uta.edu.ec',
            hashedPassword: 'hash123',
            isVerified: true,
            role: 'STUDENT',
            name: 'Heidi',
        });
        jest
            .spyOn(require('../../src/shared/services/PasswordService').PasswordService, 'compare')
            .mockResolvedValue(false);
        const input = new LoginDTO_1.LoginDTO('hvillavicencio8210@uta.edu.ec', 'malaclave');
        await expect(useCase.execute(input)).rejects.toThrow('Correo o contraseña inválidos');
    });
});
//# sourceMappingURL=auth.test.js.map