import { Request, Response } from 'express';
import { GetProfileUseCase } from '../../application/usecases/GetProfileUseCase';
import { UpdateProfileUseCase } from '../../application/usecases/UpdateProfileUseCase';
import { CreateVehicleUseCase } from '../../application/usecases/CreateVehicleUseCase';
import { GetUserVehiclesUseCase } from '../../application/usecases/GetUserVehiclesUseCase';
import { DeleteVehicleUseCase } from '../../application/usecases/DeleteVehicleUseCase';
import { UpdateVehicleUseCase } from '../../application/usecases/UpdateVehicleUseCase';
import { UpdateProfileDTO } from '../../application/dtos/UserProfileDTO';
import { CreateVehicleDTO, UpdateVehicleDTO } from '../../application/dtos/VehicleDTO';
import { AppError, ValidationError } from '@shared/errors/AppError';
import { Logger } from '@config/logger';

export class UserController {
  private logger = new Logger();

  constructor(
    private getProfileUseCase: GetProfileUseCase,
    private updateProfileUseCase: UpdateProfileUseCase,
    private createVehicleUseCase: CreateVehicleUseCase,
    private getUserVehiclesUseCase: GetUserVehiclesUseCase,
    private deleteVehicleUseCase: DeleteVehicleUseCase,
    private updateVehicleUseCase: UpdateVehicleUseCase,
  ) {}

  // === Profile ===
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId || req.user!.userId;
      const result = await this.getProfileUseCase.execute(userId);
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      this.handleError(error, res, 'get_profile');
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const dto = new UpdateProfileDTO(req.body);
      const result = await this.updateProfileUseCase.execute({ userId, data: dto });
      res.status(200).json({ success: true, data: result, message: 'Profile updated' });
    } catch (error: unknown) {
      this.handleError(error, res, 'update_profile');
    }
  }

  // === Vehicles ===
  async createVehicle(req: Request, res: Response): Promise<void> {
    try {
      const ownerId = req.user!.userId;
      const dto = new CreateVehicleDTO(req.body);
      const result = await this.createVehicleUseCase.execute({ ownerId, data: dto });
      res.status(201).json({ success: true, data: result, message: 'Vehicle created' });
    } catch (error: unknown) {
      this.handleError(error, res, 'create_vehicle');
    }
  }

  async getMyVehicles(req: Request, res: Response): Promise<void> {
    try {
      const ownerId = req.user!.userId;
      const result = await this.getUserVehiclesUseCase.execute(ownerId);
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      this.handleError(error, res, 'get_vehicles');
    }
  }

  async deleteVehicle(req: Request, res: Response): Promise<void> {
    try {
      const ownerId = req.user!.userId;
      const vehicleId = req.params.vehicleId;
      if (!vehicleId) throw new ValidationError('El ID del vehículo es obligatorio');
      await this.deleteVehicleUseCase.execute({ vehicleId, ownerId });
      res.status(200).json({ success: true, message: 'Vehicle deleted' });
    } catch (error: unknown) {
      this.handleError(error, res, 'delete_vehicle');
    }
  }

  async updateVehicle(req: Request, res: Response): Promise<void> {
    try {
      const ownerId = req.user!.userId;
      const vehicleId = req.params.vehicleId;
      if (!vehicleId) throw new ValidationError('El ID del vehículo es obligatorio');
      const dto = new UpdateVehicleDTO(req.body);
      const result = await this.updateVehicleUseCase.execute(ownerId, vehicleId, dto);
      res.status(200).json({ success: true, data: result, message: 'Vehicle updated' });
    } catch (error: unknown) {
      this.handleError(error, res, 'update_vehicle');
    }
  }

  private handleError(error: unknown, res: Response, context: string): void {
    if (error instanceof AppError) {
      this.logger.warn(`${context} failed: ${error.message}`, 'USER_CONTROLLER');
      res.status(error.statusCode).json({ success: false, error: error.message });
    } else if (error instanceof Error) {
      this.logger.error(`${context} error: ${error.message}`, 'USER_CONTROLLER');
      res.status(400).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}
