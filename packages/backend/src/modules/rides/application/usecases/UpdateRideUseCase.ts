import { IUseCase } from '@shared/types';
import { IRideRepository } from '../../domain/interfaces/IRideRepository';
import { Ride } from '../../domain/entities/Ride';
import { UpdateRideDTO } from '../dtos/RideDTO';
import { NotFoundError, AuthorizationError, ValidationError } from '@shared/errors/AppError';
import { DatabaseConnection } from '@config/database';

interface UpdateRideInput {
  rideId: string;
  driverId: string;
  data: UpdateRideDTO;
}

export class UpdateRideUseCase implements IUseCase<UpdateRideInput, Ride> {
  constructor(private rideRepository: IRideRepository) {}

  async execute(input: UpdateRideInput): Promise<Ride> {
    const ride = await this.rideRepository.findById(input.rideId);
    if (!ride) throw new NotFoundError('Ride not found');
    if (ride.driverId !== input.driverId) throw new AuthorizationError('Only the driver can update the ride');
    if (ride.status === 'COMPLETED' || ride.status === 'CANCELLED') {
      throw new ValidationError('Cannot update a completed or cancelled ride');
    }

    const pool = DatabaseConnection.getInstance();
    const activeRequestsResult = await pool.query(
      "SELECT COUNT(*) as count FROM solicitudes_viaje WHERE viaje_id = $1 AND estado IN ('PENDING', 'ACCEPTED')",
      [input.rideId]
    );
    const activeRequestsCount = parseInt(activeRequestsResult.rows[0].count, 10);
    if (activeRequestsCount > 0) {
      throw new ValidationError('No puedes editar el viaje si ya tiene pasajeros solicitando unirse o aceptados');
    }

    const existingRides = await this.rideRepository.findByDriverId(input.driverId);

    // 1. Validar que no tenga OTRO viaje en curso (IN_PROGRESS)
    const hasInProgress = existingRides.some(r => r.id !== input.rideId && r.status === 'IN_PROGRESS');
    if (hasInProgress) {
      throw new ValidationError('No puedes modificar viajes si tienes otro viaje en curso');
    }

    // 2. Validar duplicados de destino, fecha y hora excluyendo el viaje actual
    const newDest = input.data.destinationZone || ride.destinationZone;
    const newDate = input.data.departureDate || ride.departureDate;
    const newTime = input.data.departureTime || ride.departureTime;

    const hasDuplicate = existingRides.some(r =>
      r.id !== input.rideId &&
      r.status !== 'CANCELLED' &&
      r.status !== 'COMPLETED' &&
      r.destinationZone.toLowerCase() === newDest.toLowerCase() &&
      r.departureDate === newDate &&
      r.departureTime === newTime
    );
    if (hasDuplicate) {
      throw new ValidationError('Ya tienes publicado otro viaje al mismo destino para la misma fecha y hora');
    }

    return this.rideRepository.update(input.rideId, input.data as any);
  }
}
