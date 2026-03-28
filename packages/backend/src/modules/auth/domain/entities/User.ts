import { v4 as uuidv4 } from 'uuid';

/**
 * Entidad User - Capa de dominio (lógica pura de negocio)
 * NO depende de Express, BD, o ninguna librería técnica
 * Solo contiene reglas de negocio del usuario
 */
export class User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly hashedPassword: string;
  readonly role: 'STUDENT' | 'ADMIN';
  readonly isVerified: boolean;
  readonly reputation: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(
    email: string,
    name: string,
    hashedPassword: string,
    role: 'STUDENT' | 'ADMIN' = 'STUDENT',
    isVerified: boolean = false,
    reputation: number = 5.0,
    id: string = uuidv4(),
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.hashedPassword = hashedPassword;
    this.role = role;
    this.isVerified = isVerified;
    this.reputation = reputation;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Método de negocio: verificar si el usuario puede hacer acciones
   */
  canPerformAction(): boolean {
    return this.isVerified && this.reputation >= 2.0;
  }

  /**
   * Método de negocio: actualizar reputación
   */
  updateReputation(newRating: number): void {
    if (newRating < 1.0 || newRating > 5.0) {
      throw new Error('Rating must be between 1.0 and 5.0');
    }
    // Aquí iría lógica de cálculo de reputación más compleja
  }
}
