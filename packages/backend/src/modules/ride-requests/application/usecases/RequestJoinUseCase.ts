import { IUseCase } from '@shared/types';
import { IRideRequestRepository } from '../../domain/interfaces/IRideRequestRepository';
import { IRideRepository } from '@modules/rides/domain/interfaces/IRideRepository';
import { RideRequest } from '../../domain/entities/RideRequest';
import { CreateRideRequestDTO } from '../dtos/RideRequestDTO';
import { ValidationError, ConflictError, NotFoundError } from '@shared/errors/AppError';

interface RequestJoinInput {
  passengerId: string;
  data: CreateRideRequestDTO;
}

export class RequestJoinUseCase implements IUseCase<RequestJoinInput, RideRequest> {
  constructor(
    private requestRepo: IRideRequestRepository,
    private rideRepo: IRideRepository,
  ) {}

  async execute(input: RequestJoinInput): Promise<RideRequest> {
    const ride = await this.rideRepo.findById(input.data.rideId);
    if (!ride) throw new NotFoundError('Ride not found');
    if (ride.driverId === input.passengerId) throw new ValidationError('You cannot join your own ride');
    if (!ride.isAvailable()) throw new ValidationError('Ride is not available');
    if (ride.availableSeats < input.data.seatsRequested) {
      throw new ValidationError(`Only ${ride.availableSeats} seat(s) available`);
    }

    const existing = await this.requestRepo.findByRideAndPassenger(input.data.rideId, input.passengerId);
    if (existing) {
      if (existing.status !== 'CANCELLED' && existing.status !== 'REJECTED') {
        throw new ConflictError('You already have a pending or accepted request for this ride');
      }
      return this.requestRepo.update(existing.id, {
        status: 'PENDING',
        seatsRequested: input.data.seatsRequested,
        message: input.data.message || null,
        respondedAt: null,
        rejectReason: null,
        createdAt: new Date(),
      } as any);
    }

    const request = new RideRequest(
      input.data.rideId, input.passengerId,
      input.data.seatsRequested, input.data.message || null,
    );

    return this.requestRepo.create(request);
  }
}
