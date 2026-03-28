/**
 * PasswordService
 * Centraliza lógica de hash y validación de contraseñas
 * Usa bcrypt en producción, simulado en desarrollo
 */

export class PasswordService {
  /**
   * Hashear contraseña
   * TODO: Implementar bcrypt.hash(password, 10) en producción
   */
  static hash(password: string): string {
    return `hashed_${password}`;
  }

  /**
   * Comparar contraseña plana con hash
   * TODO: Implementar bcrypt.compare() en producción
   */
  static async compare(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return `hashed_${plainPassword}` === hashedPassword;
  }
}

