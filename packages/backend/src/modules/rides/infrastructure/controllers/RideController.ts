import { Request, Response } from 'express';
import { CreateRideUseCase } from '../../application/usecases/CreateRideUseCase';
import { ListRidesUseCase } from '../../application/usecases/ListRidesUseCase';
import { GetRideByIdUseCase } from '../../application/usecases/GetRideByIdUseCase';
import { UpdateRideUseCase } from '../../application/usecases/UpdateRideUseCase';
import { CancelRideUseCase } from '../../application/usecases/CancelRideUseCase';
import { CreateRideDTO, UpdateRideDTO, RideFilterDTO } from '../../application/dtos/RideDTO';
import { AppError } from '@shared/errors/AppError';
import { Logger } from '@config/logger';

export class RideController {
  private logger = new Logger();

  constructor(
    private createRideUseCase: CreateRideUseCase,
    private listRidesUseCase: ListRidesUseCase,
    private getRideByIdUseCase: GetRideByIdUseCase,
    private updateRideUseCase: UpdateRideUseCase,
    private cancelRideUseCase: CancelRideUseCase,
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const driverId = req.user!.userId;
      const dto = new CreateRideDTO(req.body);
      const result = await this.createRideUseCase.execute({ driverId, data: dto });
      this.logger.info(`Ride created: ${result.id}`, 'RIDE_CONTROLLER');
      res.status(201).json({ success: true, data: result, message: 'Ride created successfully' });
    } catch (error: unknown) {
      this.handleError(error, res, 'create_ride');
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const filters = new RideFilterDTO(req.query);
      const result = await this.listRidesUseCase.execute(filters);
      res.status(200).json({ success: true, ...result });
    } catch (error: unknown) {
      this.handleError(error, res, 'list_rides');
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.getRideByIdUseCase.execute(req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      this.handleError(error, res, 'get_ride');
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const driverId = req.user!.userId;
      const dto = new UpdateRideDTO(req.body);
      const result = await this.updateRideUseCase.execute({ rideId: req.params.id, driverId, data: dto });
      res.status(200).json({ success: true, data: result, message: 'Ride updated' });
    } catch (error: unknown) {
      this.handleError(error, res, 'update_ride');
    }
  }

  async cancel(req: Request, res: Response): Promise<void> {
    try {
      const driverId = req.user!.userId;
      await this.cancelRideUseCase.execute({ rideId: req.params.id, driverId });
      res.status(200).json({ success: true, message: 'Ride cancelled' });
    } catch (error: unknown) {
      this.handleError(error, res, 'cancel_ride');
    }
  }

  async getMyRides(req: Request, res: Response): Promise<void> {
    try {
      const filters = new RideFilterDTO({ ...req.query, driverId: req.user!.userId });
      const result = await this.listRidesUseCase.execute(filters);
      res.status(200).json({ success: true, ...result });
    } catch (error: unknown) {
      this.handleError(error, res, 'get_my_rides');
    }
  }

  private handleError(error: unknown, res: Response, context: string): void {
    if (error instanceof AppError) {
      this.logger.warn(`${context} failed: ${error.message}`, 'RIDE_CONTROLLER');
      res.status(error.statusCode).json({ success: false, error: error.message });
    } else if (error instanceof Error) {
      this.logger.error(`${context} error: ${error.message}`, 'RIDE_CONTROLLER');
      res.status(400).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}
