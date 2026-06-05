import { LoginUseCase } from '../../src/modules/auth/application/usecases/LoginUseCase';
import { LoginDTO } from '../../src/modules/auth/application/dtos/LoginDTO';
import { AuthenticationError } from '../../src/shared/errors/AppError';
import { JWTService, PasswordService } from '../../src/shared/services';

jest.mock('../../src/shared/services', () => ({
  JWTService: {
    generateTokenPair: jest.fn(),
  },
  PasswordService: {
    compare: jest.fn(),
  },
}));

describe('LoginUseCase', () => {
  let mockUserRepository: any;
  let useCase: LoginUseCase;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserRepository = {
      findByEmail: jest.fn(),
    };

    useCase = new LoginUseCase(mockUserRepository);
  });

  it('debería lanzar error cuando el usuario no existe', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute(
        new LoginDTO(
          'test@test.com',
          '123456'
        )
      )
    ).rejects.toThrow(AuthenticationError);
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

    await expect(
      useCase.execute(
        new LoginDTO(
          'test@test.com',
          '123456'
        )
      )
    ).rejects.toThrow(AuthenticationError);
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

    await expect(
      useCase.execute(
        new LoginDTO(
          'test@test.com',
          '123456'
        )
      )
    ).rejects.toThrow(AuthenticationError);
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

    (PasswordService.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      useCase.execute(
        new LoginDTO(
          'test@test.com',
          '123456'
        )
      )
    ).rejects.toThrow(AuthenticationError);
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

    (PasswordService.compare as jest.Mock).mockResolvedValue(true);

    (JWTService.generateTokenPair as jest.Mock).mockReturnValue({
      accessToken: 'access-token-test',
      refreshToken: 'refresh-token-test',
    });

    const result = await useCase.execute(
      new LoginDTO(
        'test@test.com',
        '123456'
      )
    );

    expect(result).toBeDefined();

    expect(
      PasswordService.compare
    ).toHaveBeenCalledTimes(1);

    expect(
      JWTService.generateTokenPair
    ).toHaveBeenCalledTimes(1);

    expect(result.token).toBe(
      'access-token-test'
    );

    expect(result.refreshToken).toBe(
      'refresh-token-test'
    );

    expect(result.user.email).toBe(
      'test@test.com'
    );
  });
});