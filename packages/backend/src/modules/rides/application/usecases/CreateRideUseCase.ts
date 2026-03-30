import { IUseCase } from '@shared/types';
import { IRideRepository } from '../../domain/interfaces/IRideRepository';
import { Ride } from '../../domain/entities/Ride';
import { CreateRideDTO } from '../dtos/RideDTO';
import { ValidationError } from '@shared/errors/AppError';

interface CreateRideInput {
  driverId: string;
  data: CreateRideDTO;
}

export class CreateRideUseCase implements IUseCase<CreateRideInput, Ride> {
  constructor(private rideRepository: IRideRepository) {}

  async execute(input: CreateRideInput): Promise<Ride> {
    // Validar que la fecha no sea en el pasado
    const departureDateTime = new Date(`${input.data.departureDate}T${input.data.departureTime}`);
    if (departureDateTime < new Date()) {
      throw new ValidationError('Departure date/time cannot be in the past');
    }

    const ride = new Ride(
      input.driverId,
      input.data.originZone,
      input.data.destinationZone,
      input.data.departureDate,
      input.data.departureTime,
      input.data.availableSeats,
      input.data.pricePerSeat,
      input.data.vehicleId || null,
      input.data.originDetail || null,
      input.data.destinationDetail || null,
      input.data.notes || null,
      input.data.rules || null,
    );

    return this.rideRepository.create(ride);
  }
}
