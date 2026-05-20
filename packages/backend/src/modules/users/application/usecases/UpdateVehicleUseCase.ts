import { IVehicleRepository } from '../../domain/interfaces/IVehicleRepository';
import { UpdateVehicleDTO } from '../dtos/VehicleDTO';
import { Vehicle } from '../../domain/entities/Vehicle';
import { NotFoundError, AuthorizationError } from '@shared/errors/AppError';

export class UpdateVehicleUseCase {
  constructor(private readonly vehicleRepository: IVehicleRepository) {}

  async execute(userId: string, vehicleId: string, dtos: UpdateVehicleDTO): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }
    if (vehicle.ownerId !== userId) {
      throw new AuthorizationError('You are not the owner of this vehicle');
    }
    return this.vehicleRepository.update(vehicleId, dtos);
  }
}
