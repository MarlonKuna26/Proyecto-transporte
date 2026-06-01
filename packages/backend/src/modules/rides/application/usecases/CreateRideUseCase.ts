import { IUseCase } from '@shared/types';
import { IRideRepository } from '../../domain/interfaces/IRideRepository';
import { IVehicleRepository } from '@modules/users/domain/interfaces/IVehicleRepository';
import { Ride } from '../../domain/entities/Ride';
import { CreateRideDTO } from '../dtos/RideDTO';
import { ValidationError } from '@shared/errors/AppError';

interface CreateRideInput {
  driverId: string;
  data: CreateRideDTO;
}

export class CreateRideUseCase implements IUseCase<CreateRideInput, Ride> {
  constructor(
    private rideRepository: IRideRepository,
    private vehicleRepository: IVehicleRepository,
  ) {}

async execute(input: CreateRideInput): Promise<Ride> {
    // 0. Validar que el conductor tenga al menos un vehículo registrado
    const driverVehicles = await this.vehicleRepository.findByOwnerId(input.driverId);
    if (driverVehicles.length === 0) {
      throw new ValidationError('Debes registrar un vehículo antes de publicar un viaje');
    }

    const existingRides = await this.rideRepository.findByDriverId(input.driverId);

    // 0.1. Validar que no tenga un viaje en curso (IN_PROGRESS)
    const hasInProgress = existingRides.some(r => r.status === 'IN_PROGRESS');
    if (hasInProgress) {
      throw new ValidationError('No puedes publicar un nuevo viaje si ya tienes un viaje en curso');
    }

    // 0.2. Validar que no tenga un viaje al mismo destino en la misma fecha y hora
    const hasDuplicate = existingRides.some(r =>
      r.status !== 'CANCELLED' &&
      r.status !== 'COMPLETED' &&
      r.destinationZone.toLowerCase() === input.data.destinationZone.toLowerCase() &&
      r.departureDate === input.data.departureDate &&
      r.departureTime === input.data.departureTime
    );
    if (hasDuplicate) {
      throw new ValidationError('Ya tienes publicado un viaje al mismo destino para la misma fecha y hora');
    }

    // 1. Obtenemos solo la parte del día de la fecha de salida (input format YYYY-MM-DD)
    const [year, month, day] = input.data.departureDate.split('-').map(Number);
    const departureDateOnly = new Date(year, month - 1, day);

    // 2. Obtenemos el día de hoy en la zona horaria de Ecuador, también sin horas
    const nowEcuador = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Guayaquil" }));
    const todayOnly = new Date(nowEcuador.getFullYear(), nowEcuador.getMonth(), nowEcuador.getDate());

    // 3. Comparación estricta de días
    // Si la fecha de salida es menor al día de hoy, lanzamos el error
    if (departureDateOnly.getTime() < todayOnly.getTime()) {
      throw new ValidationError('No puedes seleccionar una fecha anterior al día de hoy');
    }

    // 4. Crear la entidad
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