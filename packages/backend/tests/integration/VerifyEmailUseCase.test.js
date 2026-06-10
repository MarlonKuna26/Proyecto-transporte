"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const VerifyEmailUseCase_1 = require("../../src/modules/auth/application/usecases/VerifyEmailUseCase");
const database_1 = require("../../src/config/database");
jest.mock('../../src/config/database');
describe('VerifyEmailUseCase', () => {
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
            create: jest.fn(),
            update: jest.fn(),
        };
        useCase = new VerifyEmailUseCase_1.VerifyEmailUseCase(mockUserRepository);
    });
    it('verificar el correo y crear el usuario si no existe', async () => {
        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockQuery
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({
            rows: [
                {
                    correo: 'test@test.com',
                    nombre: 'Usuario Test',
                    contrasena_hash: 'hash123',
                    codigo: '123456',
                    expira_en: new Date(Date.now() + 15 * 60 * 1000),
                },
            ],
        })
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({});
        mockUserRepository.create.mockResolvedValue({
            id: '1',
            email: 'test@test.com',
            isVerified: true,
        });
        const result = await useCase.execute({
            email: 'test@test.com',
            code: '123456',
        });
        expect(result.verified).toBe(true);
        expect(result.message).toBe('Email verified successfully');
        expect(mockUserRepository.create).toHaveBeenCalledTimes(1);
    });
    it('retornar verificado si el usuario ya está verificado', async () => {
        mockUserRepository.findByEmail.mockResolvedValue({
            id: '1',
            email: 'test@test.com',
            isVerified: true,
        });
        mockQuery.mockResolvedValueOnce({});
        const result = await useCase.execute({
            email: 'test@test.com',
            code: '123456',
        });
        expect(result.verified).toBe(true);
        expect(result.message).toBe('Email is already verified');
    });
    it('lanzar error si no existe registro pendiente', async () => {
        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockQuery
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({
            rows: [],
        });
        await expect(useCase.execute({
            email: 'test@test.com',
            code: '123456',
        })).rejects.toThrow('No se encontró un registro pendiente para este correo');
    });
    it('lanzar error si el código es inválido', async () => {
        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockQuery
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({
            rows: [
                {
                    correo: 'test@test.com',
                    nombre: 'Usuario Test',
                    contrasena_hash: 'hash123',
                    codigo: '654321',
                    expira_en: new Date(Date.now() + 100000),
                },
            ],
        });
        await expect(useCase.execute({
            email: 'test@test.com',
            code: '123456',
        })).rejects.toThrow('Código de verificación inválido');
    });
    it('lanzar error si el código expiró', async () => {
        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockQuery
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({
            rows: [
                {
                    correo: 'test@test.com',
                    nombre: 'Usuario Test',
                    contrasena_hash: 'hash123',
                    codigo: '123456',
                    expira_en: new Date(Date.now() - 1000),
                },
            ],
        })
            .mockResolvedValueOnce({});
        await expect(useCase.execute({
            email: 'test@test.com',
            code: '123456',
        })).rejects.toThrow('Verification code expired. Please register again');
    });
    it('actualizar el usuario si existe pero no está verificado', async () => {
        mockUserRepository.findByEmail.mockResolvedValue({
            id: '1',
            email: 'test@test.com',
            isVerified: false,
        });
        mockQuery
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({
            rows: [
                {
                    correo: 'test@test.com',
                    nombre: 'Usuario Test',
                    contrasena_hash: 'hash123',
                    codigo: '123456',
                    expira_en: new Date(Date.now() + 100000),
                },
            ],
        })
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({});
        mockUserRepository.update.mockResolvedValue({
            id: '1',
            email: 'test@test.com',
            isVerified: true,
        });
        const result = await useCase.execute({
            email: 'test@test.com',
            code: '123456',
        });
        expect(result.verified).toBe(true);
        expect(mockUserRepository.update).toHaveBeenCalledTimes(1);
    });
});
//# sourceMappingURL=VerifyEmailUseCase.test.js.map