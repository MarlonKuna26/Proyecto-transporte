import { RequestPasswordResetUseCase } from '../../src/modules/auth/application/usecases/RequestPasswordResetUseCase';
import { DatabaseConnection } from '../../src/config/database';
import { EmailService } from '../../src/shared/services/EmailService';

jest.mock('../../src/config/database');
jest.mock('../../src/shared/services/EmailService');

describe('RequestPasswordResetUseCase', () => {
  let mockQuery: jest.Mock;
  let mockUserRepository: any;
  let useCase: RequestPasswordResetUseCase;

  beforeEach(() => {
    jest.clearAllMocks();

    mockQuery = jest.fn();

    (DatabaseConnection.getInstance as jest.Mock).mockReturnValue({
      query: mockQuery,
    });

    mockUserRepository = {
      findByEmail: jest.fn(),
    };

    mockQuery.mockResolvedValue({});

    (
      EmailService.sendPasswordResetCode as jest.Mock
    ).mockResolvedValue(true);

    useCase = new RequestPasswordResetUseCase(
      mockUserRepository
    );
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

    expect(
      EmailService.sendPasswordResetCode
    ).toHaveBeenCalledTimes(1);

    expect(
      EmailService.sendPasswordResetCode
    ).toHaveBeenCalledWith(
      'test@test.com',
      expect.any(String)
    );
  });

  it('retornar requested=true aunque el usuario no exista', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    const result = await useCase.execute({
      email: 'nouser@test.com',
    });

    expect(result.requested).toBe(true);

    expect(
      EmailService.sendPasswordResetCode
    ).not.toHaveBeenCalled();
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