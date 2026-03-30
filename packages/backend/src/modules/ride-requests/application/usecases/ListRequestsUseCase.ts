import { IUseCase } from '@shared/types';
import { IRideRequestRepository } from '../../domain/interfaces/IRideRequestRepository';
import { RideRequest } from '../../domain/entities/RideRequest';

interface ListRequestsInput {
  rideId?: string;
  passengerId?: string;
}

export class ListRequestsUseCase implements IUseCase<ListRequestsInput, RideRequest[]> {
  constructor(private requestRepo: IRideRequestRepository) {}

  async execute(input: ListRequestsInput): Promise<RideRequest[]> {
    if (input.rideId) {
      return this.requestRepo.findByRideId(input.rideId);
    }
    if (input.passengerId) {
      return this.requestRepo.findByPassengerId(input.passengerId);
    }
    return [];
  }
}
