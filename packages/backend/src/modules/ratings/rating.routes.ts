import { Router } from 'express';
import { authenticateToken } from '@shared/middlewares/AuthMiddleware';
import { RatingRepository } from './infrastructure/repositories/RatingRepository';
import { RideRepository } from '@modules/rides/infrastructure/repositories/RideRepository';
import { UserRepository } from '@modules/auth/infrastructure/repositories/UserRepository';
import { CreateRatingUseCase } from './application/usecases/CreateRatingUseCase';
import { GetUserRatingsUseCase } from './application/usecases/GetUserRatingsUseCase';
import { RatingController } from './infrastructure/controllers/RatingController';

export function createRatingRoutes(): Router {
  const router = Router();

  const ratingRepo = new RatingRepository();
  const rideRepo = new RideRepository();
  const userRepo = new UserRepository();

  const createRatingUseCase = new CreateRatingUseCase(ratingRepo, rideRepo, userRepo);
  const getUserRatingsUseCase = new GetUserRatingsUseCase(ratingRepo);

  const controller = new RatingController(createRatingUseCase, getUserRatingsUseCase);

  router.post('/', authenticateToken, (req, res) => controller.create(req, res));
  router.get('/user/:userId', authenticateToken, (req, res) => controller.getUserRatings(req, res));

  return router;
}
