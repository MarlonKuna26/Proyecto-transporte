import { IUseCase } from '@shared/types';
import { IVehicleRepository } from '../../domain/interfaces/IVehicleRepository';
import { NotFoundError, AuthorizationError } from '@shared/errors/AppError';

interface DeleteVehicleInput {
  vehicleId: string;
  ownerId: string;
}

export class DeleteVehicleUseCase implements IUseCase<DeleteVehicleInput, void> {
  constructor(private vehicleRepository: IVehicleRepository) {}

  async execute(input: DeleteVehicleInput): Promise<void> {
    const vehicle = await this.vehicleRepository.findById(input.vehicleId);
    if (!vehicle) {
      throw new NotFoundError('Vehículo no encontrado');
    }
    if (vehicle.ownerId !== input.ownerId) {
      throw new AuthorizationError('Solo puedes eliminar tus propios vehículos');
    }
    await this.vehicleRepository.delete(input.vehicleId);
  }
}
