"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ResetPasswordUseCase_1 = require("../../src/modules/auth/application/usecases/ResetPasswordUseCase");
const database_1 = require("../../src/config/database");
const services_1 = require("../../src/shared/services");
jest.mock('../../src/config/database');
jest.mock('../../src/shared/services');
describe('ResetPasswordUseCase', () => {
    let mockQuery;
    let mockUserRepository;
    let useCase;
    beforeEach(() => {
        jest.clearAllMocks();
        mockQuery = jest.fn();
        database_1.DatabaseConnection.getInstance.mockReturnValue({
            query: mockQuery,
        });
        mockUserRepository = {
            findByEmail: jest.fn(),
            update: jest.fn(),
        };
        useCase = new ResetPasswordUseCase_1.ResetPasswordUseCase(mockUserRepository);
    });
    it(' restablecer la contraseña cuando el código es válido', async () => {
        mockQuery
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({
            rows: [
                {
                    correo: 'test@test.com',
                    codigo: '123456',
                    expira_en: new Date(Date.now() + 15 * 60 * 1000),
                    intentos_fallidos: 0,
                    bloqueado_hasta: null,
                },
            ],
        })
            .mockResolvedValueOnce({});
        mockUserRepository.findByEmail.mockResolvedValue({
            id: '1',
            email: 'test@test.com',
        });
        mockUserRepository.update.mockResolvedValue({});
        services_1.PasswordService.hash.mockResolvedValue('hashed-password');
        const result = await useCase.execute({
            email: 'test@test.com',
            code: '123456',
            newPassword: 'Password123',
        });
        expect(result.reset).toBe(true);
        expect(result.message).toBe('Contraseña actualizada exitosamente');
        expect(services_1.PasswordService.hash).toHaveBeenCalledTimes(1);
        expect(mockUserRepository.update).toHaveBeenCalledTimes(1);
    });
    it(' lanzar error si no existe solicitud de recuperación', async () => {
        mockQuery
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({
            rows: [],
        });
        await expect(useCase.execute({
            email: 'test@test.com',
            code: '123456',
            newPassword: 'Password123',
        })).rejects.toThrow('No se encontró solicitud de recuperación para este correo');
    });
    it(' lanzar error si el código expiró', async () => {
        mockQuery
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({
            rows: [
                {
                    correo: 'test@test.com',
                    codigo: '123456',
                    expira_en: new Date(Date.now() - 1000),
                    intentos_fallidos: 0,
                    bloqueado_hasta: null,
                },
            ],
        })
            .mockResolvedValueOnce({});
        await expect(useCase.execute({
            email: 'test@test.com',
            code: '123456',
            newPassword: 'Password123',
        })).rejects.toThrow('El código de verificación ha expirado. Solicita uno nuevo');
    });
    it(' lanzar error cuando el código es incorrecto', async () => {
        mockQuery
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({
            rows: [
                {
                    correo: 'test@test.com',
                    codigo: '654321',
                    expira_en: new Date(Date.now() + 100000),
                    intentos_fallidos: 0,
                    bloqueado_hasta: null,
                },
            ],
        })
            .mockResolvedValueOnce({});
        await expect(useCase.execute({
            email: 'test@test.com',
            code: '123456',
            newPassword: 'Password123',
        })).rejects.toThrow('Código inválido. 2 intento(s) restante(s)');
    });
    it(' lanzar error si el usuario no existe', async () => {
        mockQuery
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({
            rows: [
                {
                    correo: 'test@test.com',
                    codigo: '123456',
                    expira_en: new Date(Date.now() + 100000),
                    intentos_fallidos: 0,
                    bloqueado_hasta: null,
                },
            ],
        });
        mockUserRepository.findByEmail.mockResolvedValue(null);
        await expect(useCase.execute({
            email: 'test@test.com',
            code: '123456',
            newPassword: 'Password123',
        })).rejects.toThrow('Usuario no encontrado');
    });
});
//# sourceMappingURL=ResetPasswordUseCase.test.js.map