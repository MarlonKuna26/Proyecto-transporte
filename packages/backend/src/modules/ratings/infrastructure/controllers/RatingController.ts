import { Request, Response } from 'express';
import { CreateRatingUseCase } from '../../application/usecases/CreateRatingUseCase';
import { GetUserRatingsUseCase } from '../../application/usecases/GetUserRatingsUseCase';
import { CreateRatingDTO } from '../../application/dtos/RatingDTO';
import { AppError } from '@shared/errors/AppError';
import { Logger } from '@config/logger';

export class RatingController {
  private logger = new Logger();

  constructor(
    private createRatingUseCase: CreateRatingUseCase,
    private getUserRatingsUseCase: GetUserRatingsUseCase,
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const raterId = req.user!.userId;
      const dto = new CreateRatingDTO(req.body);
      const result = await this.createRatingUseCase.execute({ raterId, data: dto });
      res.status(201).json({ success: true, data: result, message: 'Rating submitted' });
    } catch (error: unknown) {
      this.handleError(error, res, 'create_rating');
    }
  }

  async getUserRatings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const result = await this.getUserRatingsUseCase.execute(userId);
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      this.handleError(error, res, 'get_ratings');
    }
  }

  private handleError(error: unknown, res: Response, context: string): void {
    if (error instanceof AppError) {
      this.logger.warn(`${context}: ${error.message}`, 'RATING_CONTROLLER');
      res.status(error.statusCode).json({ success: false, error: error.message });
    } else if (error instanceof Error) {
      res.status(400).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}
