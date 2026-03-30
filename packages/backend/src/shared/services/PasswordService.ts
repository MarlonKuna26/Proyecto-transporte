/**
 * PasswordService
 * Centraliza lógica de hash y validación de contraseñas
 * Usa bcryptjs para hashing seguro
 */

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export class PasswordService {
  /**
   * Hashear contraseña con bcrypt
   */
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Comparar contraseña plana con hash bcrypt
   */
  static async compare(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
