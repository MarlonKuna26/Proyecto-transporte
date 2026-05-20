import { DatabaseConnection } from '@config/database';
import { RideRequest, RequestStatus } from '../../domain/entities/RideRequest';
import { IRideRequestRepository } from '../../domain/interfaces/IRideRequestRepository';
import { NotFoundError } from '@shared/errors/AppError';

interface RequestRow {
  id: string;
  viaje_id: string;
  pasajero_id: string;
  estado: RequestStatus;
  mensaje: string | null;
  asientos_solicitados: number;
  respondido_en: Date | null;
  motivo_rechazo: string | null;
  creado_en: Date;
  actualizado_en: Date;
}

export class RideRequestRepository implements IRideRequestRepository {
  private readonly pool = DatabaseConnection.getInstance();

  async create(request: RideRequest): Promise<RideRequest> {
    // Add motivo_rechazo but if it's missing from DB it will fail unless we add it to the schema.
    try {
      const query = `
        INSERT INTO solicitudes_viaje (id, viaje_id, pasajero_id, estado, mensaje, asientos_solicitados, motivo_rechazo)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const values = [request.id, request.rideId, request.passengerId, request.status, request.message, request.seatsRequested, request.rejectReason];
      const result = await this.pool.query(query, values);
      return this.mapRow(result.rows[0]);
    } catch (e: any) {
      if (e.message && e.message.includes('column "motivo_rechazo" of relation "solicitudes_viaje" does not exist')) {
        await this.pool.query('ALTER TABLE solicitudes_viaje ADD COLUMN IF NOT EXISTS motivo_rechazo varchar(255)');
        const query = `
          INSERT INTO solicitudes_viaje (id, viaje_id, pasajero_id, estado, mensaje, asientos_solicitados, motivo_rechazo)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;
        const values = [request.id, request.rideId, request.passengerId, request.status, request.message, request.seatsRequested, request.rejectReason];
        const result = await this.pool.query(query, values);
        return this.mapRow(result.rows[0]);
      }
      throw e;
    }
  }

  async findById(id: string): Promise<RideRequest | null> {
    const result = await this.pool.query('SELECT * FROM solicitudes_viaje WHERE id = $1', [id]);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async findByRideId(rideId: string): Promise<RideRequest[]> {
    const result = await this.pool.query('SELECT * FROM solicitudes_viaje WHERE viaje_id = $1 ORDER BY creado_en DESC', [rideId]);
    return result.rows.map((row: RequestRow) => this.mapRow(row));
  }

  async findByPassengerId(passengerId: string): Promise<RideRequest[]> {
    const result = await this.pool.query('SELECT * FROM solicitudes_viaje WHERE pasajero_id = $1 ORDER BY creado_en DESC', [passengerId]);
    return result.rows.map((row: RequestRow) => this.mapRow(row));
  }

  async findByRideAndPassenger(rideId: string, passengerId: string): Promise<RideRequest | null> {
    const result = await this.pool.query(
      'SELECT * FROM solicitudes_viaje WHERE viaje_id = $1 AND pasajero_id = $2 ORDER BY creado_en DESC LIMIT 1',
      [rideId, passengerId],
    );
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async update(id: string, data: Partial<RideRequest>): Promise<RideRequest> {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if ((data as any).status) { updates.push(`estado = $${idx++}`); values.push((data as any).status); }
    if ((data as any).respondedAt) { updates.push(`respondido_en = $${idx++}`); values.push((data as any).respondedAt); }
    if ((data as any).rejectReason !== undefined) { updates.push(`motivo_rechazo = $${idx++}`); values.push((data as any).rejectReason); }

    updates.push(`actualizado_en = $${idx++}`);
    values.push(new Date());
    values.push(id);

    try {
      const query = `UPDATE solicitudes_viaje SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
      const result = await this.pool.query(query, values);
      if (!result.rows[0]) throw new NotFoundError('Request not found');
      return this.mapRow(result.rows[0]);
    } catch (e: any) {
      if (e.message && e.message.includes('column "motivo_rechazo" of relation "solicitudes_viaje" does not exist')) {
        await this.pool.query('ALTER TABLE solicitudes_viaje ADD COLUMN IF NOT EXISTS motivo_rechazo varchar(255)');
        const query = `UPDATE solicitudes_viaje SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
        const result = await this.pool.query(query, values);
        if (!result.rows[0]) throw new NotFoundError('Request not found');
        return this.mapRow(result.rows[0]);
      }
      throw e;
    }
  }

  async countAcceptedByRide(rideId: string): Promise<number> {
    const result = await this.pool.query(
      "SELECT COALESCE(SUM(asientos_solicitados), 0) as total FROM solicitudes_viaje WHERE viaje_id = $1 AND estado = 'ACCEPTED'",
      [rideId],
    );
    return parseInt(result.rows[0].total);
  }

  private mapRow(row: RequestRow): RideRequest {
    return new RideRequest(
      row.viaje_id, row.pasajero_id, row.asientos_solicitados, row.mensaje,
      row.estado, row.respondido_en ? new Date(row.respondido_en) : null,
      row.motivo_rechazo || null,
      row.id, new Date(row.creado_en), new Date(row.actualizado_en),
    );
  }
}
