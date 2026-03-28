import { User } from '../entities/User';

/**
 * Interface de Repositorio - Capa de dominio (abstracción)
 * Define qué métodos debe tener CUALQUIER repositorio de usuarios
 * Desacopla la lógica de negocio de la implementación técnica
 */
export interface IUserRepository {
  // Crear
  create(user: User): Promise<User>;

  // Leer
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;

  // Actualizar
  update(id: string, user: Partial<User>): Promise<User>;

  // Eliminar
  delete(id: string): Promise<void>;

  // Query específicas
  findByRole(role: 'STUDENT' | 'ADMIN'): Promise<User[]>;
  findVerifiedUsers(): Promise<User[]>;
}
