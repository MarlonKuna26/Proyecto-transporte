import { IUseCase } from '@shared/types';
import { IRideRequestRepository } from '../../domain/interfaces/IRideRequestRepository';
import { IRideRepository } from '@modules/rides/domain/interfaces/IRideRepository';
import { NotFoundError, AuthorizationError, ValidationError } from '@shared/errors/AppError';
import { DatabaseConnection } from '@config/database';
import { EmailService } from '@shared/services/EmailService';

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

    const ride = await this.rideRepo.findById(request.rideId);

    // Si estaba aceptada, devolver asientos
    if (request.status === 'ACCEPTED') {
      await this.rideRepo.updateSeats(request.rideId, request.seatsRequested);

      // Notificar al conductor
      if (ride) {
        const pool = DatabaseConnection.getInstance();
        try {
          const driverResult = await pool.query(
            `SELECT correo FROM usuarios WHERE id = $1`,
            [ride.driverId]
          );
          const passengerResult = await pool.query(
            `SELECT nombre FROM perfiles_usuario WHERE usuario_id = $1`,
            [request.passengerId]
          );

          const driverEmail = driverResult.rows[0]?.correo;
          const passengerName = passengerResult.rows[0]?.nombre;

          if (driverEmail) {
            EmailService.sendPassengerCancelledRequestEmail(driverEmail, {
              origin: ride.originZone,
              destination: ride.destinationZone,
              date: ride.departureDate,
              time: ride.departureTime,
              passengerName: passengerName
            }).catch(err => console.error(`Failed to send cancellation email to ${driverEmail}:`, err));
          }
        } catch (err) {
          console.error('Error fetching driver email for cancellation notification:', err);
        }
      }
    }

    await this.requestRepo.update(input.requestId, { status: 'CANCELLED' } as any);
  }
}
