import { DatabaseConnection } from '@config/database';
import { RideRequest, RequestStatus } from '../../domain/entities/RideRequest';
import { IRideRequestRepository } from '../../domain/interfaces/IRideRequestRepository';
import { NotFoundError } from '@shared/errors/AppError';

interface RequestRow {
  id: string;
  ride_id: string;
  passenger_id: string;
  status: RequestStatus;
  message: string | null;
  seats_requested: number;
  responded_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export class RideRequestRepository implements IRideRequestRepository {
  private readonly pool = DatabaseConnection.getInstance();

  async create(request: RideRequest): Promise<RideRequest> {
    const query = `
      INSERT INTO ride_requests (id, ride_id, passenger_id, status, message, seats_requested)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [request.id, request.rideId, request.passengerId, request.status, request.message, request.seatsRequested];
    const result = await this.pool.query(query, values);
    return this.mapRow(result.rows[0]);
  }

  async findById(id: string): Promise<RideRequest | null> {
    const result = await this.pool.query('SELECT * FROM ride_requests WHERE id = $1', [id]);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async findByRideId(rideId: string): Promise<RideRequest[]> {
    const result = await this.pool.query('SELECT * FROM ride_requests WHERE ride_id = $1 ORDER BY created_at DESC', [rideId]);
    return result.rows.map((row: RequestRow) => this.mapRow(row));
  }

  async findByPassengerId(passengerId: string): Promise<RideRequest[]> {
    const result = await this.pool.query('SELECT * FROM ride_requests WHERE passenger_id = $1 ORDER BY created_at DESC', [passengerId]);
    return result.rows.map((row: RequestRow) => this.mapRow(row));
  }

  async findByRideAndPassenger(rideId: string, passengerId: string): Promise<RideRequest | null> {
    const result = await this.pool.query(
      'SELECT * FROM ride_requests WHERE ride_id = $1 AND passenger_id = $2 ORDER BY created_at DESC LIMIT 1',
      [rideId, passengerId],
    );
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async update(id: string, data: Partial<RideRequest>): Promise<RideRequest> {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if ((data as any).status) { updates.push(`status = $${idx++}`); values.push((data as any).status); }
    if ((data as any).respondedAt) { updates.push(`responded_at = $${idx++}`); values.push((data as any).respondedAt); }

    updates.push(`updated_at = $${idx++}`);
    values.push(new Date());
    values.push(id);

    const query = `UPDATE ride_requests SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await this.pool.query(query, values);
    if (!result.rows[0]) throw new NotFoundError('Request not found');
    return this.mapRow(result.rows[0]);
  }

  async countAcceptedByRide(rideId: string): Promise<number> {
    const result = await this.pool.query(
      "SELECT COALESCE(SUM(seats_requested), 0) as total FROM ride_requests WHERE ride_id = $1 AND status = 'ACCEPTED'",
      [rideId],
    );
    return parseInt(result.rows[0].total);
  }

  private mapRow(row: RequestRow): RideRequest {
    return new RideRequest(
      row.ride_id, row.passenger_id, row.seats_requested, row.message,
      row.status, row.responded_at ? new Date(row.responded_at) : null,
      row.id, new Date(row.created_at), new Date(row.updated_at),
    );
  }
}
