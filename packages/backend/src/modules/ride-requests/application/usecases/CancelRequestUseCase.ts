import { IUseCase } from '@shared/types';
import { IRideRequestRepository } from '../../domain/interfaces/IRideRequestRepository';
import { IRideRepository } from '@modules/rides/domain/interfaces/IRideRepository';
import { NotFoundError, AuthorizationError, ValidationError } from '@shared/errors/AppError';

interface CancelRequestInput {
  requestId: string;
  passengerId: string;
}

export class CancelRequestUseCase implements IUseCase<CancelRequestInput, void> {
  constructor(
    private requestRepo: IRideRequestRepository,
    private rideRepo: IRideRepository,
  ) {}

  async execute(input: CancelRequestInput): Promise<void> {
    const request = await this.requestRepo.findById(input.requestId);
    if (!request) throw new NotFoundError('Request not found');
    if (request.passengerId !== input.passengerId) throw new AuthorizationError('You can only cancel your own requests');
    if (request.status === 'CANCELLED') throw new ValidationError('Request is already cancelled');

    // Si estaba aceptada, devolver asientos
    if (request.status === 'ACCEPTED') {
      await this.rideRepo.updateSeats(request.rideId, request.seatsRequested);
    }

    await this.requestRepo.update(input.requestId, { status: 'CANCELLED' } as any);
  }
}
