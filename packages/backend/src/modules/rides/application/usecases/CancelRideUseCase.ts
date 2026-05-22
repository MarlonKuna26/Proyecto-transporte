import { IUseCase } from '@shared/types';
import { IRideRepository } from '../../domain/interfaces/IRideRepository';
import { NotFoundError, AuthorizationError, ValidationError } from '@shared/errors/AppError';
import { DatabaseConnection } from '@config/database';
import { EmailService } from '@shared/services/EmailService';

interface CancelRideInput {
  rideId: string;
  driverId: string;
}

export class CancelRideUseCase implements IUseCase<CancelRideInput, void> {
  constructor(private rideRepository: IRideRepository) {}

  async execute(input: CancelRideInput): Promise<void> {
    const ride = await this.rideRepository.findById(input.rideId);
    if (!ride) throw new NotFoundError('Ride not found');
    if (ride.driverId !== input.driverId) throw new AuthorizationError('Only the driver can cancel the ride');
    if (ride.status === 'COMPLETED' || ride.status === 'CANCELLED') {
      throw new ValidationError('Ride is already completed or cancelled');
    }

    const pool = DatabaseConnection.getInstance();

    // 1. Get emails of pending/accepted passengers
    const passengersResult = await pool.query(
      `SELECT u.correo 
       FROM solicitudes_viaje s
       JOIN usuarios u ON s.pasajero_id = u.id
       WHERE s.viaje_id = $1 AND s.estado IN ('PENDING', 'ACCEPTED')`,
      [input.rideId]
    );
    const passengerEmails: string[] = passengersResult.rows.map((r: any) => r.correo).filter(Boolean);

    // 2. Perform cancellations in DB
    await this.rideRepository.update(input.rideId, { status: 'CANCELLED' } as any);

    // Cancel related requests
    await pool.query(
      `UPDATE solicitudes_viaje 
       SET estado = 'CANCELLED', actualizado_en = NOW() 
       WHERE viaje_id = $1 AND estado IN ('PENDING', 'ACCEPTED')`,
      [input.rideId]
    );

    // 3. Send emails asynchronously/safely without blocking too long
    for (const email of passengerEmails) {
      try {
        await EmailService.sendRideCancellationEmail(email, {
          origin: ride.originZone,
          destination: ride.destinationZone,
          date: ride.departureDate,
          time: ride.departureTime,
        });
      } catch (err) {
        console.error(`Failed to send cancellation email to ${email}:`, err);
      }
    }
  }
}
