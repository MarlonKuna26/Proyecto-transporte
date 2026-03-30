import { DatabaseConnection } from '@config/database';
import { Vehicle } from '../../domain/entities/Vehicle';
import { IVehicleRepository } from '../../domain/interfaces/IVehicleRepository';
import { NotFoundError } from '@shared/errors/AppError';

interface VehicleRow {
  id: string;
  owner_id: string;
  plate: string;
  brand: string;
  model: string;
  color: string;
  year: number | null;
  capacity: number;
  photo_url: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class VehicleRepository implements IVehicleRepository {
  private readonly pool = DatabaseConnection.getInstance();

  async create(vehicle: Vehicle): Promise<Vehicle> {
    const query = `
      INSERT INTO vehicles (id, owner_id, plate, brand, model, color, year, capacity, photo_url, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const values = [
      vehicle.id, vehicle.ownerId, vehicle.plate, vehicle.brand,
      vehicle.model, vehicle.color, vehicle.year, vehicle.capacity,
      vehicle.photoUrl, vehicle.isActive,
    ];
    const result = await this.pool.query(query, values);
    return this.mapRow(result.rows[0]);
  }

  async findById(id: string): Promise<Vehicle | null> {
    const result = await this.pool.query('SELECT * FROM vehicles WHERE id = $1', [id]);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async findByOwnerId(ownerId: string): Promise<Vehicle[]> {
    const result = await this.pool.query(
      'SELECT * FROM vehicles WHERE owner_id = $1 AND is_active = true ORDER BY created_at DESC',
      [ownerId],
    );
    return result.rows.map((row: VehicleRow) => this.mapRow(row));
  }

  async update(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    const vehicle = await this.findById(id);
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const fieldMap: Record<string, string> = {
      plate: 'plate', brand: 'brand', model: 'model', color: 'color',
      year: 'year', capacity: 'capacity', photoUrl: 'photo_url', isActive: 'is_active',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if ((data as any)[key] !== undefined) {
        updates.push(`${col} = $${idx++}`);
        values.push((data as any)[key]);
      }
    }

    updates.push(`updated_at = $${idx++}`);
    values.push(new Date());
    values.push(id);

    const query = `UPDATE vehicles SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await this.pool.query(query, values);
    return this.mapRow(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('UPDATE vehicles SET is_active = false, updated_at = NOW() WHERE id = $1', [id]);
  }

  private mapRow(row: VehicleRow): Vehicle {
    return new Vehicle(
      row.owner_id, row.plate, row.brand, row.model, row.color,
      row.capacity, row.year, row.photo_url, row.is_active,
      row.id, new Date(row.created_at), new Date(row.updated_at),
    );
  }
}
