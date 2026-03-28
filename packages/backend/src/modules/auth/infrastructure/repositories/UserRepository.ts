import { DatabaseConnection } from '@config/database';
import { User } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { NotFoundError } from '@shared/errors/AppError';

interface UserRow {
  id: string;
  email: string;
  name: string;
  hashed_password: string;
  role: 'STUDENT' | 'ADMIN';
  is_verified: boolean;
  reputation: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Repository - Capa de infraestructura
 * Implementa IUserRepository usando PostgreSQL
 * Toda la lógica de BD va aquí
 * Si mañana cambias de BD (MongoDB, etc.), solo cambias esta clase
 */
export class UserRepository implements IUserRepository {
  private readonly pool = DatabaseConnection.getInstance();

  async create(user: User): Promise<User> {
    const query = `
      INSERT INTO users (
        id, email, name, hashed_password, role, is_verified, reputation, created_at, updated_at
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
    const query = 'SELECT * FROM users WHERE id = $1;';
    const result = await this.pool.query(query, [id]);
    return result.rows[0] ? this.mapRowToUser(result.rows[0]) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1;';
    const result = await this.pool.query(query, [email]);
    return result.rows[0] ? this.mapRowToUser(result.rows[0]) : null;
  }

  async findAll(): Promise<User[]> {
    const query = 'SELECT * FROM users ORDER BY created_at DESC;';
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
      updates.push(`name = $${paramIndex++}`);
      values.push(userData.name);
    }
    if (userData.reputation !== undefined) {
      updates.push(`reputation = $${paramIndex++}`);
      values.push(userData.reputation);
    }
    if (userData.isVerified !== undefined) {
      updates.push(`is_verified = $${paramIndex++}`);
      values.push(userData.isVerified);
    }

    updates.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());

    values.push(id);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *;`;
    const result = await this.pool.query(query, values);

    return this.mapRowToUser(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    const query = 'DELETE FROM users WHERE id = $1;';
    await this.pool.query(query, [id]);
  }

  async findByRole(role: 'STUDENT' | 'ADMIN'): Promise<User[]> {
    const query = 'SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC;';
    const result = await this.pool.query(query, [role]);
    return result.rows.map((row: UserRow) => this.mapRowToUser(row));
  }

  async findVerifiedUsers(): Promise<User[]> {
    const query = 'SELECT * FROM users WHERE is_verified = true ORDER BY created_at DESC;';
    const result = await this.pool.query(query);
    return result.rows.map((row: UserRow) => this.mapRowToUser(row));
  }

  /**
   * Private: Mapear fila de BD a entidad User
   */
  private mapRowToUser(row: UserRow): User {
    return new User(
      row.email,
      row.name,
      row.hashed_password,
      row.role,
      row.is_verified,
      row.reputation,
      row.id,
      new Date(row.created_at),
      new Date(row.updated_at),
    );
  }
}
