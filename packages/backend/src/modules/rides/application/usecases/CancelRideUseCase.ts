import { IUseCase } from '@shared/types';
import { IRideRepository } from '../../domain/interfaces/IRideRepository';
import { NotFoundError, AuthorizationError, ValidationError } from '@shared/errors/AppError';
import { DatabaseConnection } from '@config/database'; // Import it

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

    await this.rideRepository.update(input.rideId, { status: 'CANCELLED' } as any);

    // Cancel related requests
    const pool = DatabaseConnection.getInstance();
    await pool.query(
      `UPDATE solicitudes_viaje 
       SET estado = 'CANCELLED', actualizado_en = NOW() 
       WHERE viaje_id = $1 AND estado IN ('PENDING', 'ACCEPTED')`,
      [input.rideId]
    );
  }
}
