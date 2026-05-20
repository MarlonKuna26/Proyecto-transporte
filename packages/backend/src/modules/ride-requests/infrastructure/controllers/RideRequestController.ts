import { Request, Response } from 'express';
import { RequestJoinUseCase } from '../../application/usecases/RequestJoinUseCase';
import { AcceptRequestUseCase } from '../../application/usecases/AcceptRequestUseCase';
import { RejectRequestUseCase } from '../../application/usecases/RejectRequestUseCase';
import { ListRequestsUseCase } from '../../application/usecases/ListRequestsUseCase';
import { CancelRequestUseCase } from '../../application/usecases/CancelRequestUseCase';
import { CreateRideRequestDTO } from '../../application/dtos/RideRequestDTO';
import { AppError } from '@shared/errors/AppError';
import { Logger } from '@config/logger';

export class RideRequestController {
  private logger = new Logger();

  constructor(
    private requestJoinUseCase: RequestJoinUseCase,
    private acceptRequestUseCase: AcceptRequestUseCase,
    private rejectRequestUseCase: RejectRequestUseCase,
    private listRequestsUseCase: ListRequestsUseCase,
    private cancelRequestUseCase: CancelRequestUseCase,
  ) {}

  async requestJoin(req: Request, res: Response): Promise<void> {
    try {
      const passengerId = req.user!.userId;
      const dto = new CreateRideRequestDTO(req.body);
      const result = await this.requestJoinUseCase.execute({ passengerId, data: dto });
      res.status(201).json({ success: true, data: result, message: 'Request sent successfully' });
    } catch (error: unknown) {
      this.handleError(error, res, 'request_join');
    }
  }

  async accept(req: Request, res: Response): Promise<void> {
    try {
      const driverId = req.user!.userId;
      const result = await this.acceptRequestUseCase.execute({ requestId: req.params.id, driverId });
      res.status(200).json({ success: true, data: result, message: 'Request accepted' });
    } catch (error: unknown) {
      this.handleError(error, res, 'accept_request');
    }
  }

  async reject(req: Request, res: Response): Promise<void> {
    try {
      const driverId = req.user!.userId;
      const { rejectReason } = req.body;
      const result = await this.rejectRequestUseCase.execute({ requestId: req.params.id, driverId, rejectReason });
      res.status(200).json({ success: true, data: result, message: 'Request rejected' });
    } catch (error: unknown) {
      this.handleError(error, res, 'reject_request');
    }
  }

  async listByRide(req: Request, res: Response): Promise<void> {
  try {

    const driverId = req.user!.userId;

    const result = await this.listRequestsUseCase.execute({
      rideId: req.params.rideId,
      driverId,
    });

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error: unknown) {
    this.handleError(error, res, 'list_requests');
  }
}
  async listMyRequests(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.listRequestsUseCase.execute({ passengerId: req.user!.userId });
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      this.handleError(error, res, 'list_my_requests');
    }
  }

  async cancel(req: Request, res: Response): Promise<void> {
    try {
      const passengerId = req.user!.userId;
      await this.cancelRequestUseCase.execute({ requestId: req.params.id, passengerId });
      res.status(200).json({ success: true, message: 'Request cancelled' });
    } catch (error: unknown) {
      this.handleError(error, res, 'cancel_request');
    }
  }

  private handleError(error: unknown, res: Response, context: string): void {
    if (error instanceof AppError) {
      this.logger.warn(`${context} failed: ${error.message}`, 'RIDE_REQUEST_CONTROLLER');
      res.status(error.statusCode).json({ success: false, error: error.message });
    } else if (error instanceof Error) {
      this.logger.error(`${context} error: ${error.message}`, 'RIDE_REQUEST_CONTROLLER');
      res.status(400).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}
