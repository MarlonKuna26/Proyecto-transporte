"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RequestPasswordResetUseCase_1 = require("../../src/modules/auth/application/usecases/RequestPasswordResetUseCase");
const database_1 = require("../../src/config/database");
const EmailService_1 = require("../../src/shared/services/EmailService");
jest.mock('../../src/config/database');
jest.mock('../../src/shared/services/EmailService');
describe('RequestPasswordResetUseCase', () => {
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
        };
        mockQuery.mockResolvedValue({});
        EmailService_1.EmailService.sendPasswordResetCode.mockResolvedValue(true);
        useCase = new RequestPasswordResetUseCase_1.RequestPasswordResetUseCase(mockUserRepository);
    });
    it('código de recuperación y enviar correo cuando el usuario existe', async () => {
        mockUserRepository.findByEmail.mockResolvedValue({
            id: '123',
            email: 'test@test.com',
            nombre: 'Usuario Test',
        });
        const result = await useCase.execute({
            email: 'test@test.com',
        });
        expect(result.requested).toBe(true);
        expect(EmailService_1.EmailService.sendPasswordResetCode).toHaveBeenCalledTimes(1);
        expect(EmailService_1.EmailService.sendPasswordResetCode).toHaveBeenCalledWith('test@test.com', expect.any(String));
    });
    it('retornar requested=true aunque el usuario no exista', async () => {
        mockUserRepository.findByEmail.mockResolvedValue(null);
        const result = await useCase.execute({
            email: 'nouser@test.com',
        });
        expect(result.requested).toBe(true);
        expect(EmailService_1.EmailService.sendPasswordResetCode).not.toHaveBeenCalled();
    });
    it('incluir el código de recuperación cuando EMAIL_DEV_MODE está activo', async () => {
        process.env.EMAIL_DEV_MODE = 'true';
        mockUserRepository.findByEmail.mockResolvedValue({
            id: '123',
            email: 'test@test.com',
            nombre: 'Usuario Test',
        });
        const result = await useCase.execute({
            email: 'test@test.com',
        });
        expect(result.requested).toBe(true);
        expect(result.code).toBeDefined();
        process.env.EMAIL_DEV_MODE = 'false';
    });
});
//# sourceMappingURL=RequestPasswordResetUseCase.test.js.map