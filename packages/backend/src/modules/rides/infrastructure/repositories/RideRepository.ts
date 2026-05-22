import { DatabaseConnection } from '@config/database';
import { Ride, RideStatus } from '../../domain/entities/Ride';
import { IRideRepository, RideFilters } from '../../domain/interfaces/IRideRepository';
import { NotFoundError } from '@shared/errors/AppError';

interface RideRow {
  id: string;
  conductor_id: string;
  vehiculo_id: string | null;
  zona_origen: string;
  detalle_origen: string | null;
  zona_destino: string;
  detalle_destino: string | null;
  fecha_salida: string;
  hora_salida: string;
  asientos_disponibles: number;
  precio_por_asiento: number;
  estado: RideStatus;
  notas: string | null;
  reglas: string | null;
  creado_en: Date;
  actualizado_en: Date;
  latitud_origen: number | null;
  longitud_origen: number | null;
  latitud_destino: number | null;
  longitud_destino: number | null;
  inicio_real: Date | null;
  fin_real: Date | null;
  tiene_solicitudes?: boolean;
}

export class RideRepository implements IRideRepository {
  private readonly pool = DatabaseConnection.getInstance();

  async create(ride: Ride): Promise<Ride> {
    const query = `
      INSERT INTO viajes (id, conductor_id, vehiculo_id, zona_origen, detalle_origen, zona_destino, detalle_destino, fecha_salida, hora_salida, asientos_disponibles, precio_por_asiento, estado, notas, reglas, latitud_origen, longitud_origen, latitud_destino, longitud_destino)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;
    const values = [
      ride.id, ride.driverId, ride.vehicleId, ride.originZone, ride.originDetail,
      ride.destinationZone, ride.destinationDetail, ride.departureDate, ride.departureTime,
      ride.availableSeats, ride.pricePerSeat, ride.status, ride.notes, ride.rules,
      (ride as any).originLat || null, (ride as any).originLng || null,
      (ride as any).destinationLat || null, (ride as any).destinationLng || null,
    ];
    const result = await this.pool.query(query, values);
    return this.mapRow(result.rows[0]);
  }

  async findById(id: string): Promise<Ride | null> {
    const result = await this.pool.query(
      `SELECT *, EXISTS(
        SELECT 1 FROM solicitudes_viaje 
        WHERE viaje_id = viajes.id AND estado IN ('PENDING', 'ACCEPTED')
      ) AS tiene_solicitudes FROM viajes WHERE id = $1`, [id]
    );
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async findAll(filters?: RideFilters, limit: number = 20, offset: number = 0): Promise<Ride[]> {
    let query = `
      SELECT *, EXISTS(
        SELECT 1 FROM solicitudes_viaje 
        WHERE viaje_id = viajes.id AND estado IN ('PENDING', 'ACCEPTED')
      ) AS tiene_solicitudes FROM viajes WHERE 1=1
    `;
    const values: any[] = [];
    let idx = 1;

    if (filters) {
      if (filters.originZone) {
        query += ` AND LOWER(zona_origen) LIKE LOWER($${idx++})`;
        values.push(`%${filters.originZone}%`);
      }
      if (filters.destinationZone) {
        query += ` AND LOWER(zona_destino) LIKE LOWER($${idx++})`;
        values.push(`%${filters.destinationZone}%`);
      }
      if (filters.departureDate) {
        query += ` AND fecha_salida = $${idx++}`;
        values.push(filters.departureDate);
      }
      if (filters.status) {
        query += ` AND estado = $${idx++}`;
        values.push(filters.status);
      }
      if (filters.driverId) {
        query += ` AND conductor_id = $${idx++}`;
        values.push(filters.driverId);
      }
    }

    query += ` ORDER BY fecha_salida ASC, hora_salida ASC LIMIT $${idx++} OFFSET $${idx++}`;
    values.push(limit, offset);

    const result = await this.pool.query(query, values);
    return result.rows.map((row: RideRow) => this.mapRow(row));
  }

  async countAll(filters?: RideFilters): Promise<number> {
    let query = 'SELECT COUNT(*) as total FROM viajes WHERE 1=1';
    const values: any[] = [];
    let idx = 1;

    if (filters) {
      if (filters.originZone) {
        query += ` AND LOWER(zona_origen) LIKE LOWER($${idx++})`;
        values.push(`%${filters.originZone}%`);
      }
      if (filters.destinationZone) {
        query += ` AND LOWER(zona_destino) LIKE LOWER($${idx++})`;
        values.push(`%${filters.destinationZone}%`);
      }
      if (filters.departureDate) {
        query += ` AND fecha_salida = $${idx++}`;
        values.push(filters.departureDate);
      }
      if (filters.status) {
        query += ` AND estado = $${idx++}`;
        values.push(filters.status);
      }
      if (filters.driverId) {
        query += ` AND conductor_id = $${idx++}`;
        values.push(filters.driverId);
      }
    }

    const result = await this.pool.query(query, values);
    return parseInt(result.rows[0].total);
  }

  async findByDriverId(driverId: string): Promise<Ride[]> {
    const result = await this.pool.query(
      `SELECT *, EXISTS(
        SELECT 1 FROM solicitudes_viaje 
        WHERE viaje_id = viajes.id AND estado IN ('PENDING', 'ACCEPTED')
      ) AS tiene_solicitudes FROM viajes WHERE conductor_id = $1 ORDER BY fecha_salida DESC, hora_salida DESC`,
      [driverId],
    );
    return result.rows.map((row: RideRow) => this.mapRow(row));
  }

  async update(id: string, data: Partial<Ride>): Promise<Ride> {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const fieldMap: Record<string, string> = {
      originZone: 'zona_origen', originDetail: 'detalle_origen',
      destinationZone: 'zona_destino', destinationDetail: 'detalle_destino',
      departureDate: 'fecha_salida', departureTime: 'hora_salida',
      availableSeats: 'asientos_disponibles', pricePerSeat: 'precio_por_asiento',
      vehicleId: 'vehiculo_id', status: 'estado', notes: 'notas', rules: 'reglas',
      originLat: 'latitud_origen', originLng: 'longitud_origen',
      destinationLat: 'latitud_destino', destinationLng: 'longitud_destino',
      actualStart: 'inicio_real', actualEnd: 'fin_real',
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

    updates.push(`actualizado_en = $${idx++}`);
    values.push(new Date());
    values.push(id);

    const query = `UPDATE viajes SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await this.pool.query(query, values);
    if (!result.rows[0]) throw new NotFoundError('Ride not found');
    const updatedRide = await this.findById(id);
    if (!updatedRide) throw new NotFoundError('Ride not found');
    return updatedRide;
  }

  async updateSeats(id: string, seatsDelta: number): Promise<Ride> {
    const query = `
      UPDATE viajes SET asientos_disponibles = asientos_disponibles + $1, actualizado_en = NOW()
      WHERE id = $2 RETURNING *
    `;
    const result = await this.pool.query(query, [seatsDelta, id]);
    if (!result.rows[0]) throw new NotFoundError('Ride not found');

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
    await this.pool.query('DELETE FROM viajes WHERE id = $1', [id]);
  }

  private mapRow(row: RideRow): Ride {
    const ride = new Ride(
      row.conductor_id, row.zona_origen, row.zona_destino,
      typeof row.fecha_salida === 'object' ? (row.fecha_salida as any).toISOString().split('T')[0] : row.fecha_salida,
      row.hora_salida, row.asientos_disponibles, parseFloat(String(row.precio_por_asiento)),
      row.vehiculo_id, row.detalle_origen, row.detalle_destino,
      row.notas, row.reglas, row.estado, row.id,
      new Date(row.creado_en), new Date(row.actualizado_en),
      row.tiene_solicitudes,
    );
    // Attach coordinate fields
    (ride as any).originLat = row.latitud_origen ? parseFloat(String(row.latitud_origen)) : null;
    (ride as any).originLng = row.longitud_origen ? parseFloat(String(row.longitud_origen)) : null;
    (ride as any).destinationLat = row.latitud_destino ? parseFloat(String(row.latitud_destino)) : null;
    (ride as any).destinationLng = row.longitud_destino ? parseFloat(String(row.longitud_destino)) : null;
    (ride as any).actualStart = row.inicio_real;
    (ride as any).actualEnd = row.fin_real;
    return ride;
  }
}
