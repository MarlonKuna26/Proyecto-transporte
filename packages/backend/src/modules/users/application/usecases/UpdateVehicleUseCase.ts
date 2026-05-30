import { IVehicleRepository } from '../../domain/interfaces/IVehicleRepository';
import { UpdateVehicleDTO } from '../dtos/VehicleDTO';
import { Vehicle } from '../../domain/entities/Vehicle';
import { NotFoundError, AuthorizationError } from '@shared/errors/AppError';

export class UpdateVehicleUseCase {
  constructor(private readonly vehicleRepository: IVehicleRepository) {}

  async execute(userId: string, vehicleId: string, dtos: UpdateVehicleDTO): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle) {
      throw new NotFoundError('Vehículo no encontrado');
    }
    if (vehicle.ownerId !== userId) {
      throw new AuthorizationError('No eres el dueño de este vehículo');
    }
    return this.vehicleRepository.update(vehicleId, dtos);
  }
}
