import { IUseCase } from '@shared/types';
import { IRideRepository } from '../../domain/interfaces/IRideRepository';
import { Ride } from '../../domain/entities/Ride';
import { UpdateRideDTO } from '../dtos/RideDTO';
import { NotFoundError, AuthorizationError, ValidationError } from '@shared/errors/AppError';

interface UpdateRideInput {
  rideId: string;
  driverId: string;
  data: UpdateRideDTO;
}

export class UpdateRideUseCase implements IUseCase<UpdateRideInput, Ride> {
  constructor(private rideRepository: IRideRepository) {}

  async execute(input: UpdateRideInput): Promise<Ride> {
    const ride = await this.rideRepository.findById(input.rideId);
    if (!ride) throw new NotFoundError('Ride not found');
    if (ride.driverId !== input.driverId) throw new AuthorizationError('Only the driver can update the ride');
    if (ride.status === 'COMPLETED' || ride.status === 'CANCELLED') {
      throw new ValidationError('Cannot update a completed or cancelled ride');
    }

    return this.rideRepository.update(input.rideId, input.data as any);
  }
}
