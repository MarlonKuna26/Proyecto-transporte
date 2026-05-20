import { IUseCase } from '@shared/types';
import { IRideRequestRepository } from '../../domain/interfaces/IRideRequestRepository';
import { IRideRepository } from '@modules/rides/domain/interfaces/IRideRepository';
import { RideRequest } from '../../domain/entities/RideRequest';
import { AuthorizationError, NotFoundError } from '@shared/errors/AppError';

interface ListRequestsInput {
  rideId?: string;
  passengerId?: string;
  driverId?: string;
}

export class ListRequestsUseCase implements IUseCase<ListRequestsInput, RideRequest[]> {

  constructor(
    private requestRepo: IRideRequestRepository,
    private rideRepo: IRideRepository,
  ) {}

  async execute(input: ListRequestsInput): Promise<RideRequest[]> {

    // Solicitudes de un viaje (solo conductor dueño)
    if (input.rideId) {

      const ride = await this.rideRepo.findById(input.rideId);

      if (!ride) {
        throw new NotFoundError('Ride not found');
      }

      if (ride.driverId !== input.driverId) {
        throw new AuthorizationError(
          'You are not authorized to view these requests'
        );
      }

      return this.requestRepo.findByRideId(input.rideId);
    }

    // Solicitudes del pasajero
    if (input.passengerId) {
      return this.requestRepo.findByPassengerId(input.passengerId);
    }

    return [];
  }
}