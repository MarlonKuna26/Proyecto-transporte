import { IVehicleRepository } from '../../domain/interfaces/IVehicleRepository';
import { UpdateVehicleDTO } from '../dtos/VehicleDTO';
import { Vehicle } from '../../domain/entities/Vehicle';
import { CustomError } from '@shared/errors/CustomError';

export class UpdateVehicleUseCase {
  constructor(private readonly vehicleRepository: IVehicleRepository) {}

  async execute(userId: string, vehicleId: string, dtos: UpdateVehicleDTO): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle) {
      throw new CustomError('Vehicle not found', 404);
    }
    if (vehicle.ownerId !== userId) {
      throw new CustomError('You are not the owner of this vehicle', 403);
    }
    return this.vehicleRepository.update(vehicleId, dtos);
  }
}
