import { DatabaseConnection } from '@config/database';
import { Ride, RideStatus } from '../../domain/entities/Ride';
import { IRideRepository, RideFilters } from '../../domain/interfaces/IRideRepository';
import { NotFoundError } from '@shared/errors/AppError';

interface RideRow {
  id: string;
  driver_id: string;
  vehicle_id: string | null;
  origin_zone: string;
  origin_detail: string | null;
  destination_zone: string;
  destination_detail: string | null;
  departure_date: string;
  departure_time: string;
  available_seats: number;
  price_per_seat: number;
  status: RideStatus;
  notes: string | null;
  rules: string | null;
  created_at: Date;
  updated_at: Date;
}

export class RideRepository implements IRideRepository {
  private readonly pool = DatabaseConnection.getInstance();

  async create(ride: Ride): Promise<Ride> {
    const query = `
      INSERT INTO rides (id, driver_id, vehicle_id, origin_zone, origin_detail, destination_zone, destination_detail, departure_date, departure_time, available_seats, price_per_seat, status, notes, rules)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    const values = [
      ride.id, ride.driverId, ride.vehicleId, ride.originZone, ride.originDetail,
      ride.destinationZone, ride.destinationDetail, ride.departureDate, ride.departureTime,
      ride.availableSeats, ride.pricePerSeat, ride.status, ride.notes, ride.rules,
    ];
    const result = await this.pool.query(query, values);
    return this.mapRow(result.rows[0]);
  }

  async findById(id: string): Promise<Ride | null> {
    const result = await this.pool.query('SELECT * FROM rides WHERE id = $1', [id]);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async findAll(filters?: RideFilters, limit: number = 20, offset: number = 0): Promise<Ride[]> {
    let query = 'SELECT * FROM rides WHERE 1=1';
    const values: any[] = [];
    let idx = 1;

    if (filters) {
      if (filters.originZone) {
        query += ` AND LOWER(origin_zone) LIKE LOWER($${idx++})`;
        values.push(`%${filters.originZone}%`);
      }
      if (filters.destinationZone) {
        query += ` AND LOWER(destination_zone) LIKE LOWER($${idx++})`;
        values.push(`%${filters.destinationZone}%`);
      }
      if (filters.departureDate) {
        query += ` AND departure_date = $${idx++}`;
        values.push(filters.departureDate);
      }
      if (filters.status) {
        query += ` AND status = $${idx++}`;
        values.push(filters.status);
      }
      if (filters.driverId) {
        query += ` AND driver_id = $${idx++}`;
        values.push(filters.driverId);
      }
    }

    query += ` ORDER BY departure_date ASC, departure_time ASC LIMIT $${idx++} OFFSET $${idx++}`;
    values.push(limit, offset);

    const result = await this.pool.query(query, values);
    return result.rows.map((row: RideRow) => this.mapRow(row));
  }

  async countAll(filters?: RideFilters): Promise<number> {
    let query = 'SELECT COUNT(*) as total FROM rides WHERE 1=1';
    const values: any[] = [];
    let idx = 1;

    if (filters) {
      if (filters.originZone) {
        query += ` AND LOWER(origin_zone) LIKE LOWER($${idx++})`;
        values.push(`%${filters.originZone}%`);
      }
      if (filters.destinationZone) {
        query += ` AND LOWER(destination_zone) LIKE LOWER($${idx++})`;
        values.push(`%${filters.destinationZone}%`);
      }
      if (filters.departureDate) {
        query += ` AND departure_date = $${idx++}`;
        values.push(filters.departureDate);
      }
      if (filters.status) {
        query += ` AND status = $${idx++}`;
        values.push(filters.status);
      }
      if (filters.driverId) {
        query += ` AND driver_id = $${idx++}`;
        values.push(filters.driverId);
      }
    }

    const result = await this.pool.query(query, values);
    return parseInt(result.rows[0].total);
  }

  async findByDriverId(driverId: string): Promise<Ride[]> {
    const result = await this.pool.query(
      'SELECT * FROM rides WHERE driver_id = $1 ORDER BY departure_date DESC, departure_time DESC',
      [driverId],
    );
    return result.rows.map((row: RideRow) => this.mapRow(row));
  }

  async update(id: string, data: Partial<Ride>): Promise<Ride> {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const fieldMap: Record<string, string> = {
      originZone: 'origin_zone', originDetail: 'origin_detail',
      destinationZone: 'destination_zone', destinationDetail: 'destination_detail',
      departureDate: 'departure_date', departureTime: 'departure_time',
      availableSeats: 'available_seats', pricePerSeat: 'price_per_seat',
      vehicleId: 'vehicle_id', status: 'status', notes: 'notes', rules: 'rules',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if ((data as any)[key] !== undefined) {
        updates.push(`${col} = $${idx++}`);
        values.push((data as any)[key]);
      }
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      return existing!;
    }

    updates.push(`updated_at = $${idx++}`);
    values.push(new Date());
    values.push(id);

    const query = `UPDATE rides SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await this.pool.query(query, values);
    if (!result.rows[0]) throw new NotFoundError('Ride not found');
    return this.mapRow(result.rows[0]);
  }

  async updateSeats(id: string, seatsDelta: number): Promise<Ride> {
    const query = `
      UPDATE rides SET available_seats = available_seats + $1, updated_at = NOW()
      WHERE id = $2 RETURNING *
    `;
    const result = await this.pool.query(query, [seatsDelta, id]);
    if (!result.rows[0]) throw new NotFoundError('Ride not found');

    // Auto update status
    const ride = this.mapRow(result.rows[0]);
    if (ride.availableSeats <= 0 && ride.status === 'PUBLISHED') {
      return this.update(id, { status: 'FULL' } as any);
    }
    if (ride.availableSeats > 0 && ride.status === 'FULL') {
      return this.update(id, { status: 'PUBLISHED' } as any);
    }

    return ride;
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM rides WHERE id = $1', [id]);
  }

  private mapRow(row: RideRow): Ride {
    return new Ride(
      row.driver_id, row.origin_zone, row.destination_zone,
      typeof row.departure_date === 'object' ? (row.departure_date as any).toISOString().split('T')[0] : row.departure_date,
      row.departure_time, row.available_seats, parseFloat(String(row.price_per_seat)),
      row.vehicle_id, row.origin_detail, row.destination_detail,
      row.notes, row.rules, row.status, row.id,
      new Date(row.created_at), new Date(row.updated_at),
    );
  }
}
