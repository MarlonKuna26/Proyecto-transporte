import { IUseCase } from '@shared/types';
import { IRideRequestRepository } from '../../domain/interfaces/IRideRequestRepository';
import { IRideRepository } from '@modules/rides/domain/interfaces/IRideRepository';
import { RideRequest } from '../../domain/entities/RideRequest';
import { NotFoundError, AuthorizationError, ValidationError } from '@shared/errors/AppError';
import { DatabaseConnection } from '@config/database';
import { EmailService } from '@shared/services/EmailService';

interface RejectRequestInput {
  requestId: string;
  driverId: string;
  rejectReason?: string;
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

    const updatedRequest = await this.requestRepo.update(input.requestId, {
      status: 'REJECTED',
      respondedAt: new Date(),
      rejectReason: input.rejectReason || null,
    } as any);

    // Enviar notificación por correo de manera segura
    const pool = DatabaseConnection.getInstance();
    try {
      const userResult = await pool.query(
        `SELECT correo FROM usuarios WHERE id = $1`,
        [request.passengerId]
      );
      const passengerEmail = userResult.rows[0]?.correo;

      if (passengerEmail) {
        EmailService.sendRideRequestRejectedEmail(passengerEmail, {
          origin: ride.originZone,
          destination: ride.destinationZone,
          date: ride.departureDate,
          time: ride.departureTime,
          rejectReason: input.rejectReason || null,
        }).catch(err => console.error(`Failed to send request rejected email to ${passengerEmail}:`, err));
      }
    } catch (err) {
      console.error('Error fetching passenger email for rejection notification:', err);
    }

    return updatedRequest;
  }
}
