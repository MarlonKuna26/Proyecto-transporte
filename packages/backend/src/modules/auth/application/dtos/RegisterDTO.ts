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
      throw new Error('Email is required and must be a string');
    }

    if (!this.name || typeof this.name !== 'string' || this.name.trim().length < 2) {
      throw new Error('Name is required and must be at least 2 characters');
    }

    if (!this.password || this.password.length < 8) {
      throw new Error('Password is required and must be at least 8 characters');
    }

    if (!this.isValidInstitutionalEmail(this.email)) {
      throw new Error('Must use an institutional email (.edu, .edu.co, etc.)');
    }
  }

  private isValidInstitutionalEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;
    // Acepta cualquier email para desarrollo, en producción filtrar por dominio
    return true;
  }
}

export class RegisterResponseDTO {
  userId: string;
  email: string;
  name: string;
  verificationCode?: string; // Solo en desarrollo

  constructor(userId: string, email: string, name: string, verificationCode?: string) {
    this.userId = userId;
    this.email = email;
    this.name = name;
    this.verificationCode = verificationCode;
  }
}
