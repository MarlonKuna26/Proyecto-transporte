import { DatabaseConnection } from '@config/database';
import { Vehicle } from '../../domain/entities/Vehicle';
import { IVehicleRepository } from '../../domain/interfaces/IVehicleRepository';
import { NotFoundError } from '@shared/errors/AppError';

interface VehicleRow {
  id: string;
  propietario_id: string;
  placa: string;
  marca: string;
  modelo: string;
  color: string;
  anio: number | null;
  capacidad: number;
  url_foto: string | null;
  esta_activo: boolean;
  creado_en: Date;
  actualizado_en: Date;
}

export class VehicleRepository implements IVehicleRepository {
  private readonly pool = DatabaseConnection.getInstance();

  async create(vehicle: Vehicle): Promise<Vehicle> {
    const query = `
      INSERT INTO vehiculos (id, propietario_id, placa, marca, modelo, color, anio, capacidad, url_foto, esta_activo)
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
    const result = await this.pool.query('SELECT * FROM vehiculos WHERE id = $1', [id]);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async findByOwnerId(ownerId: string): Promise<Vehicle[]> {
    const result = await this.pool.query(
      'SELECT * FROM vehiculos WHERE propietario_id = $1 AND esta_activo = true ORDER BY creado_en DESC',
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
      plate: 'placa', brand: 'marca', model: 'modelo', color: 'color',
      year: 'anio', capacity: 'capacidad', photoUrl: 'url_foto', isActive: 'esta_activo',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if ((data as any)[key] !== undefined) {
        updates.push(`${col} = $${idx++}`);
        values.push((data as any)[key]);
      }
    }

    updates.push(`actualizado_en = $${idx++}`);
    values.push(new Date());
    values.push(id);

    const query = `UPDATE vehiculos SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await this.pool.query(query, values);
    return this.mapRow(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('UPDATE vehiculos SET esta_activo = false, actualizado_en = NOW() WHERE id = $1', [id]);
  }

  private mapRow(row: VehicleRow): Vehicle {
    return new Vehicle(
      row.propietario_id, row.placa, row.marca, row.modelo, row.color,
      row.capacidad, row.anio, row.url_foto, row.esta_activo,
      row.id, new Date(row.creado_en), new Date(row.actualizado_en),
    );
  }
}
