import { IUseCase } from '@shared/types';
import { IVehicleRepository } from '../../domain/interfaces/IVehicleRepository';
import { Vehicle } from '../../domain/entities/Vehicle';

export class GetUserVehiclesUseCase implements IUseCase<string, Vehicle[]> {
  constructor(private vehicleRepository: IVehicleRepository) {}

  async execute(ownerId: string): Promise<Vehicle[]> {
    return this.vehicleRepository.findByOwnerId(ownerId);
  }
}
