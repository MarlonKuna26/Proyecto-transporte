import { IUseCase } from '@shared/types';
import { IRideRequestRepository } from '../../domain/interfaces/IRideRequestRepository';
import { IRideRepository } from '@modules/rides/domain/interfaces/IRideRepository';
import { RideRequest } from '../../domain/entities/RideRequest';
import { NotFoundError, AuthorizationError, ValidationError } from '@shared/errors/AppError';

interface RejectRequestInput {
  requestId: string;
  driverId: string;
}

export class RejectRequestUseCase implements IUseCase<RejectRequestInput, RideRequest> {
  constructor(
    private requestRepo: IRideRequestRepository,
    private rideRepo: IRideRepository,
  ) {}

  async execute(input: RejectRequestInput): Promise<RideRequest> {
    const request = await this.requestRepo.findById(input.requestId);
    if (!request) throw new NotFoundError('Request not found');
    if (request.status !== 'PENDING') throw new ValidationError('Request is not pending');

    const ride = await this.rideRepo.findById(request.rideId);
    if (!ride) throw new NotFoundError('Ride not found');
    if (ride.driverId !== input.driverId) throw new AuthorizationError('Only the driver can reject requests');

    return this.requestRepo.update(input.requestId, {
      status: 'REJECTED',
      respondedAt: new Date(),
    } as any);
  }
}
