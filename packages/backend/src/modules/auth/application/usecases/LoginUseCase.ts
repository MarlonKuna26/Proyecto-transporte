import { IUseCase } from '@shared/types';
import { LoginDTO, LoginResponseDTO } from '../dtos/LoginDTO';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { AuthenticationError } from '@shared/errors/AppError';
import { JWTService, PasswordService } from '@shared/services';

/**
 * UseCase: Login
 * Capa de aplicación (lógica de negocio pura)
 *
 * Responsabilidades:
 * 1. Validar credenciales
 * 2. Buscar usuario en BD
 * 3. Verificar contraseña
 * 4. Generar tokens JWT
 * 5. Retornar respuesta
 *
 * NO depende de Express, HTTP o base de datos específica
 * Recibe un repositorio INYECTADO (Dependency Injection)
 */
export class LoginUseCase implements IUseCase<LoginDTO, LoginResponseDTO> {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: LoginDTO): Promise<LoginResponseDTO> {
    // 1. Buscar usuario por email
    const user = await this.userRepository.findByEmail(input.email);

    if (!user) {
      // No revelar si el email existe (seguridad)
      throw new AuthenticationError('Invalid email or password');
    }

    // 2. Verificar que el usuario esté verificado
    if (!user.isVerified) {
      throw new AuthenticationError('Email not verified. Please check your inbox.');
    }

    // 3. Validar contraseña con bcrypt
    const isPasswordValid = await PasswordService.compare(input.password, user.hashedPassword);

    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // 4. Generar tokens JWT
    const { accessToken, refreshToken } = JWTService.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // 5. Retornar response con tokens
    return new LoginResponseDTO(accessToken, refreshToken, user.id, user.email, user.name, user.role);
  }
}

