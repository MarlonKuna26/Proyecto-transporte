import { IUseCase } from '@shared/types';
import { IRatingRepository } from '../../domain/interfaces/IRatingRepository';
import { IRideRepository } from '@modules/rides/domain/interfaces/IRideRepository';
import { IUserRepository } from '@modules/auth/domain/interfaces/IUserRepository';
import { Rating } from '../../domain/entities/Rating';
import { CreateRatingDTO } from '../dtos/RatingDTO';
import { NotFoundError, ValidationError, ConflictError } from '@shared/errors/AppError';
import { DatabaseConnection } from '@config/database';

interface CreateRatingInput {
  raterId: string;
  data: CreateRatingDTO;
}

export class CreateRatingUseCase implements IUseCase<CreateRatingInput, Rating> {
  constructor(
    private ratingRepo: IRatingRepository,
    private rideRepo: IRideRepository,
    private userRepo: IUserRepository,
  ) {}

  async execute(input: CreateRatingInput): Promise<Rating> {
    if (input.raterId === input.data.ratedId) {
      throw new ValidationError('No puedes calificarte a ti mismo');
    }

    const ride = await this.rideRepo.findById(input.data.rideId);
    if (!ride) throw new NotFoundError('Viaje no encontrado');
    if (ride.status !== 'COMPLETED' && ride.status !== 'CANCELLED') {
      throw new ValidationError('Solo se pueden calificar viajes completados o cancelados');
    }

    // Determinar rol
    const roleInRide = ride.driverId === input.raterId ? 'DRIVER' : 'PASSENGER';

    if (roleInRide === 'PASSENGER') {
      const pool = DatabaseConnection.getInstance();
      const requestResult = await pool.query(
        "SELECT estado FROM solicitudes_viaje WHERE viaje_id = $1 AND pasajero_id = $2",
        [input.data.rideId, input.raterId]
      );
      if (requestResult.rows.length === 0) {
        throw new ValidationError('Debes haber solicitado unirte al viaje para poder calificarlo');
      }
    } else {
      if (ride.driverId !== input.raterId) {
        throw new ValidationError('No eres el conductor de este viaje');
      }
    }

    // Verificar que no haya calificación duplicada
    const existing = await this.ratingRepo.findByRaterAndRide(input.raterId, input.data.rideId, input.data.ratedId);
    if (existing) throw new ConflictError('Ya calificaste a este usuario para este viaje');

    const rating = new Rating(
      input.data.rideId, input.raterId, input.data.ratedId,
      input.data.score, roleInRide, input.data.comment || null,
    );

    const created = await this.ratingRepo.create(rating);

    // Actualizar reputación del usuario calificado
    const stats = await this.ratingRepo.getAverageAndCount(input.data.ratedId);
    await this.userRepo.update(input.data.ratedId, {
      reputation: stats.average,
    } as any);

    return created;
  }
}
