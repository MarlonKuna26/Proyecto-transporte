import { IUseCase } from '@shared/types';
import { IRideRequestRepository } from '../../domain/interfaces/IRideRequestRepository';
import { IRideRepository } from '@modules/rides/domain/interfaces/IRideRepository';
import { RideRequest } from '../../domain/entities/RideRequest';
import { AuthorizationError, NotFoundError } from '@shared/errors/AppError';

interface ListRequestsInput {
  rideId?: string;
  passengerId?: string;
  driverId?: string;
  onlyAccepted?: boolean; // ← agregar esto
}

export class ListRequestsUseCase implements IUseCase<ListRequestsInput, RideRequest[]> {

  constructor(
    private requestRepo: IRideRequestRepository,
    private rideRepo: IRideRepository,
  ) {}

  async execute(input: ListRequestsInput): Promise<RideRequest[]> {

    // NUEVO: pasajeros aceptados públicos (sin validar driverId)
    if (input.rideId && input.onlyAccepted) {
      const ride = await this.rideRepo.findById(input.rideId);
      if (!ride) throw new NotFoundError('Viaje no encontrado');
      const all = await this.requestRepo.findByRideId(input.rideId);
      return all.filter(r => r.status === 'ACCEPTED');
    }

    // Solicitudes de un viaje (solo conductor dueño) — igual que antes
    if (input.rideId) {
      const ride = await this.rideRepo.findById(input.rideId);
      if (!ride) throw new NotFoundError('Viaje no encontrado');
      if (ride.driverId !== input.driverId) {
        throw new AuthorizationError('No tienes autorización para ver estas solicitudes');
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