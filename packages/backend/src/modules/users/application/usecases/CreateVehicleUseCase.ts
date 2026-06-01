import { IUseCase } from '@shared/types';
import { IVehicleRepository } from '../../domain/interfaces/IVehicleRepository';
import { Vehicle } from '../../domain/entities/Vehicle';
import { CreateVehicleDTO } from '../dtos/VehicleDTO';

interface CreateVehicleInput {
  ownerId: string;
  data: CreateVehicleDTO;
}

export class CreateVehicleUseCase implements IUseCase<CreateVehicleInput, Vehicle> {
  constructor(private vehicleRepository: IVehicleRepository) {}

  async execute(input: CreateVehicleInput): Promise<Vehicle> {
    const vehicle = new Vehicle(
      input.ownerId,
      input.data.plate,
      input.data.brand,
      input.data.model,
      input.data.color,
      input.data.capacity,
      input.data.year || null,
      input.data.photoUrl || null,
    );

    return this.vehicleRepository.create(vehicle);
  }
}
