/**
 * DTO - Data Transfer Object
 * Objeto que define la estructura de datos que entra/sale en un UseCase
 * Valida que los datos sean correctos antes de procesarlos
 */

export class LoginDTO {
  email: string;
  password: string;

  constructor(email: string, password: string) {
    this.email = email;
    this.password = password;
    this.validate();
  }

  private validate(): void {
    if (!this.email || typeof this.email !== 'string') {
      throw new Error('El correo es obligatorio y debe ser una cadena de texto');
    }

    if (!this.password || this.password.length < 6) {
      throw new Error('La contraseña es obligatoria y debe tener al menos 6 caracteres');
    }

    if (!this.isValidEmail(this.email)) {
      throw new Error('Formato de correo inválido');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

/**
 * DTO de respuesta
 */
export class LoginResponseDTO {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };

  constructor(
    token: string,
    refreshToken: string,
    userId: string,
    email: string,
    name: string,
    role: string,
  ) {
    this.token = token;
    this.refreshToken = refreshToken;
    this.user = { id: userId, email, name, role };
  }
}
