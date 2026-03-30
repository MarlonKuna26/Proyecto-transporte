import { DatabaseConnection } from '@config/database';
import { Rating } from '../../domain/entities/Rating';
import { IRatingRepository } from '../../domain/interfaces/IRatingRepository';

interface RatingRow {
  id: string;
  ride_id: string;
  rater_id: string;
  rated_id: string;
  score: number;
  comment: string | null;
  role_in_ride: 'DRIVER' | 'PASSENGER';
  created_at: Date;
}

export class RatingRepository implements IRatingRepository {
  private readonly pool = DatabaseConnection.getInstance();

  async create(rating: Rating): Promise<Rating> {
    const query = `
      INSERT INTO ratings (id, ride_id, rater_id, rated_id, score, comment, role_in_ride)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `;
    const result = await this.pool.query(query, [
      rating.id, rating.rideId, rating.raterId, rating.ratedId,
      rating.score, rating.comment, rating.roleInRide,
    ]);
    return this.mapRow(result.rows[0]);
  }

  async findByRatedId(ratedId: string): Promise<Rating[]> {
    const result = await this.pool.query(
      'SELECT * FROM ratings WHERE rated_id = $1 ORDER BY created_at DESC', [ratedId],
    );
    return result.rows.map((r: RatingRow) => this.mapRow(r));
  }

  async findByRideId(rideId: string): Promise<Rating[]> {
    const result = await this.pool.query(
      'SELECT * FROM ratings WHERE ride_id = $1 ORDER BY created_at DESC', [rideId],
    );
    return result.rows.map((r: RatingRow) => this.mapRow(r));
  }

  async findByRaterAndRide(raterId: string, rideId: string, ratedId: string): Promise<Rating | null> {
    const result = await this.pool.query(
      'SELECT * FROM ratings WHERE rater_id = $1 AND ride_id = $2 AND rated_id = $3',
      [raterId, rideId, ratedId],
    );
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async getAverageAndCount(userId: string): Promise<{ average: number; count: number }> {
    const result = await this.pool.query(
      'SELECT COALESCE(AVG(score), 5.0) as average, COUNT(*) as count FROM ratings WHERE rated_id = $1',
      [userId],
    );
    return {
      average: parseFloat(parseFloat(result.rows[0].average).toFixed(2)),
      count: parseInt(result.rows[0].count),
    };
  }

  private mapRow(row: RatingRow): Rating {
    return new Rating(
      row.ride_id, row.rater_id, row.rated_id, row.score,
      row.role_in_ride, row.comment, row.id, new Date(row.created_at),
    );
  }
}
