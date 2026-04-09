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
  creado_en: Date;
  actualizado_en: Date;
}

export class RideRequestRepository implements IRideRequestRepository {
  private readonly pool = DatabaseConnection.getInstance();

  async create(request: RideRequest): Promise<RideRequest> {
    const query = `
      INSERT INTO solicitudes_viaje (id, viaje_id, pasajero_id, estado, mensaje, asientos_solicitados)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [request.id, request.rideId, request.passengerId, request.status, request.message, request.seatsRequested];
    const result = await this.pool.query(query, values);
    return this.mapRow(result.rows[0]);
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

    updates.push(`actualizado_en = $${idx++}`);
    values.push(new Date());
    values.push(id);

    const query = `UPDATE solicitudes_viaje SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await this.pool.query(query, values);
    if (!result.rows[0]) throw new NotFoundError('Request not found');
    return this.mapRow(result.rows[0]);
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
      row.id, new Date(row.creado_en), new Date(row.actualizado_en),
    );
  }
}
