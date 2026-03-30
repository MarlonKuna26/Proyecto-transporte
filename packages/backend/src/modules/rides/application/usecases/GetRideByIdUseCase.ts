import { IUseCase } from '@shared/types';
import { IRideRepository } from '../../domain/interfaces/IRideRepository';
import { Ride } from '../../domain/entities/Ride';
import { NotFoundError } from '@shared/errors/AppError';

export class GetRideByIdUseCase implements IUseCase<string, Ride> {
  constructor(private rideRepository: IRideRepository) {}

  async execute(id: string): Promise<Ride> {
    const ride = await this.rideRepository.findById(id);
    if (!ride) throw new NotFoundError('Ride not found');
    return ride;
  }
}
