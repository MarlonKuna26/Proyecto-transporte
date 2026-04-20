/**
 * RegisterDTO - Data Transfer Object para registro
 */

export class RegisterDTO {
  email: string;
  name: string;
  password: string;

  constructor(email: string, name: string, password: string) {
    this.email = email;
    this.name = name;
    this.password = password;
    this.validate();
  }

  private validate(): void {
    if (!this.email || typeof this.email !== 'string') {
      throw new Error('El correo electrónico es obligatorio');
    }

    if (!this.isValidInstitutionalEmail(this.email)) {
      throw new Error('Solo se permiten correos institucionales @uta.edu.ec');
    }

    if (!this.name || this.name.trim().length < 2) {
      throw new Error('El nombre debe tener al menos 2 caracteres');
    }

    if (!this.password || this.password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }
  }

  private isValidInstitutionalEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@uta\.edu\.ec$/;
    return emailRegex.test(email);
  }
}

export class RegisterResponseDTO {
  userId: string;
  email: string;
  name: string;
  verificationCode?: string;

  constructor(userId: string, email: string, name: string, verificationCode?: string) {
    this.userId = userId;
    this.email = email;
    this.name = name;
    this.verificationCode = verificationCode;
  }
}