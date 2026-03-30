import { IUseCase } from '@shared/types';
import { IRatingRepository } from '../../domain/interfaces/IRatingRepository';
import { IRideRepository } from '@modules/rides/domain/interfaces/IRideRepository';
import { IUserRepository } from '@modules/auth/domain/interfaces/IUserRepository';
import { Rating } from '../../domain/entities/Rating';
import { CreateRatingDTO } from '../dtos/RatingDTO';
import { NotFoundError, ValidationError, ConflictError } from '@shared/errors/AppError';

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
      throw new ValidationError('You cannot rate yourself');
    }

    const ride = await this.rideRepo.findById(input.data.rideId);
    if (!ride) throw new NotFoundError('Ride not found');
    if (ride.status !== 'COMPLETED') throw new ValidationError('Can only rate completed rides');

    // Determinar rol
    const roleInRide = ride.driverId === input.raterId ? 'DRIVER' : 'PASSENGER';

    // Verificar que no haya calificación duplicada
    const existing = await this.ratingRepo.findByRaterAndRide(input.raterId, input.data.rideId, input.data.ratedId);
    if (existing) throw new ConflictError('You already rated this user for this ride');

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
