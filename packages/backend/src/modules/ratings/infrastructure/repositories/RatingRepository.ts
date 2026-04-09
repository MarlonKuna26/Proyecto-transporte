import { DatabaseConnection } from '@config/database';
import { Rating } from '../../domain/entities/Rating';
import { IRatingRepository } from '../../domain/interfaces/IRatingRepository';

interface RatingRow {
  id: string;
  viaje_id: string;
  calificador_id: string;
  calificado_id: string;
  puntuacion: number;
  comentario: string | null;
  rol_en_viaje: 'DRIVER' | 'PASSENGER';
  creado_en: Date;
}

export class RatingRepository implements IRatingRepository {
  private readonly pool = DatabaseConnection.getInstance();

  async create(rating: Rating): Promise<Rating> {
    const query = `
      INSERT INTO calificaciones (id, viaje_id, calificador_id, calificado_id, puntuacion, comentario, rol_en_viaje)
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
      'SELECT * FROM calificaciones WHERE calificado_id = $1 ORDER BY creado_en DESC', [ratedId],
    );
    return result.rows.map((r: RatingRow) => this.mapRow(r));
  }

  async findByRideId(rideId: string): Promise<Rating[]> {
    const result = await this.pool.query(
      'SELECT * FROM calificaciones WHERE viaje_id = $1 ORDER BY creado_en DESC', [rideId],
    );
    return result.rows.map((r: RatingRow) => this.mapRow(r));
  }

  async findByRaterAndRide(raterId: string, rideId: string, ratedId: string): Promise<Rating | null> {
    const result = await this.pool.query(
      'SELECT * FROM calificaciones WHERE calificador_id = $1 AND viaje_id = $2 AND calificado_id = $3',
      [raterId, rideId, ratedId],
    );
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async getAverageAndCount(userId: string): Promise<{ average: number; count: number }> {
    const result = await this.pool.query(
      'SELECT COALESCE(AVG(puntuacion), 5.0) as average, COUNT(*) as count FROM calificaciones WHERE calificado_id = $1',
      [userId],
    );
    return {
      average: parseFloat(parseFloat(result.rows[0].average).toFixed(2)),
      count: parseInt(result.rows[0].count),
    };
  }

  private mapRow(row: RatingRow): Rating {
    return new Rating(
      row.viaje_id, row.calificador_id, row.calificado_id, row.puntuacion,
      row.rol_en_viaje, row.comentario, row.id, new Date(row.creado_en),
    );
  }
}
