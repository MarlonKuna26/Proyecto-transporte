import { IUseCase } from '@shared/types';
import { IRideRequestRepository } from '../../domain/interfaces/IRideRequestRepository';
import { IRideRepository } from '@modules/rides/domain/interfaces/IRideRepository';
import { RideRequest } from '../../domain/entities/RideRequest';
import { NotFoundError, AuthorizationError, ValidationError } from '@shared/errors/AppError';
import { DatabaseConnection } from '@config/database';
import { EmailService } from '@shared/services/EmailService';

interface AcceptRequestInput {
  requestId: string;
  driverId: string;
}

export class AcceptRequestUseCase implements IUseCase<AcceptRequestInput, RideRequest> {
  constructor(
    private requestRepo: IRideRequestRepository,
    private rideRepo: IRideRepository,
  ) {}

  async execute(input: AcceptRequestInput): Promise<RideRequest> {
    const request = await this.requestRepo.findById(input.requestId);
    if (!request) throw new NotFoundError('Request not found');
    if (request.status !== 'PENDING') throw new ValidationError('Request is not pending');

    const ride = await this.rideRepo.findById(request.rideId);
    if (!ride) throw new NotFoundError('Ride not found');
    if (ride.driverId !== input.driverId) throw new AuthorizationError('Only the driver can accept requests');
    if (ride.availableSeats < request.seatsRequested) {
      throw new ValidationError('Not enough seats available');
    }

    // Decrementar asientos
    await this.rideRepo.updateSeats(ride.id, -request.seatsRequested);

    // Aceptar solicitud
    const updatedRequest = await this.requestRepo.update(input.requestId, {
      status: 'ACCEPTED',
      respondedAt: new Date(),
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
        EmailService.sendRideRequestAcceptedEmail(passengerEmail, {
          origin: ride.originZone,
          destination: ride.destinationZone,
          date: ride.departureDate,
          time: ride.departureTime,
        }).catch(err => console.error(`Failed to send request accepted email to ${passengerEmail}:`, err));
      }
    } catch (err) {
      console.error('Error fetching passenger email for acceptance notification:', err);
    }

    return updatedRequest;
  }
}
