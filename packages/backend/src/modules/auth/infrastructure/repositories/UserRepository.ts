import { DatabaseConnection } from '@config/database';
import { User } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { NotFoundError } from '@shared/errors/AppError';

interface UserRow {
  id: string;
  correo: string;
  nombre: string;
  contrasena_hash: string;
  rol: 'STUDENT' | 'ADMIN';
  esta_verificado: boolean;
  reputacion: number;
  creado_en: Date;
  actualizado_en: Date;
  esta_suspendido: boolean;
  motivo_suspension: string | null;
  suspendido_hasta: Date | null;
}

export class UserRepository implements IUserRepository {
  private readonly pool = DatabaseConnection.getInstance();

  async create(user: User): Promise<User> {
    const query = `
      INSERT INTO usuarios (
        id, correo, nombre, contrasena_hash, rol, esta_verificado, reputacion, creado_en, actualizado_en
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;

    const values = [
      user.id,
      user.email,
      user.name,
      user.hashedPassword,
      user.role,
      user.isVerified,
      user.reputation,
      user.createdAt,
      user.updatedAt,
    ];

    try {
      const result = await this.pool.query(query, values);
      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate')) {
        throw new Error(`User with email ${user.email} already exists`);
      }
      throw error;
    }
  }

  async findById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM usuarios WHERE id = $1;';
    const result = await this.pool.query(query, [id]);
    return result.rows[0] ? this.mapRowToUser(result.rows[0]) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM usuarios WHERE correo = $1;';
    const result = await this.pool.query(query, [email]);
    return result.rows[0] ? this.mapRowToUser(result.rows[0]) : null;
  }

  async findAll(): Promise<User[]> {
    const query = 'SELECT * FROM usuarios ORDER BY creado_en DESC;';
    const result = await this.pool.query(query);
    return result.rows.map((row: UserRow) => this.mapRowToUser(row));
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundError(`User ${id} not found`);
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (userData.name) {
      updates.push(`nombre = $${paramIndex++}`);
      values.push(userData.name);
    }
    if (userData.reputation !== undefined) {
      updates.push(`reputacion = $${paramIndex++}`);
      values.push(userData.reputation);
    }
    if (userData.isVerified !== undefined) {
      updates.push(`esta_verificado = $${paramIndex++}`);
      values.push(userData.isVerified);
    }
    if ((userData as any).hashedPassword) {
      updates.push(`contrasena_hash = $${paramIndex++}`);
      values.push((userData as any).hashedPassword);
    }

    updates.push(`actualizado_en = $${paramIndex++}`);
    values.push(new Date());

    values.push(id);

    const query = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *;`;
    const result = await this.pool.query(query, values);

    return this.mapRowToUser(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    const query = 'DELETE FROM usuarios WHERE id = $1;';
    await this.pool.query(query, [id]);
  }

  async findByRole(role: 'STUDENT' | 'ADMIN'): Promise<User[]> {
    const query = 'SELECT * FROM usuarios WHERE rol = $1 ORDER BY creado_en DESC;';
    const result = await this.pool.query(query, [role]);
    return result.rows.map((row: UserRow) => this.mapRowToUser(row));
  }

  async findVerifiedUsers(): Promise<User[]> {
    const query = 'SELECT * FROM usuarios WHERE esta_verificado = true ORDER BY creado_en DESC;';
    const result = await this.pool.query(query);
    return result.rows.map((row: UserRow) => this.mapRowToUser(row));
  }

  private mapRowToUser(row: UserRow): User {
    return new User(
      row.correo,
      row.nombre,
      row.contrasena_hash,
      row.rol,
      row.esta_verificado,
      row.reputacion,
      row.id,
      new Date(row.creado_en),
      new Date(row.actualizado_en),
    );
  }
}
