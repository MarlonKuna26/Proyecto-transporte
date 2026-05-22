import { Router } from 'express';
import { authenticateToken } from '@shared/middlewares/AuthMiddleware';
import { RideRepository } from './infrastructure/repositories/RideRepository';
import { VehicleRepository } from '@modules/users/infrastructure/repositories/VehicleRepository';
import { CreateRideUseCase } from './application/usecases/CreateRideUseCase';
import { ListRidesUseCase } from './application/usecases/ListRidesUseCase';
import { GetRideByIdUseCase } from './application/usecases/GetRideByIdUseCase';
import { UpdateRideUseCase } from './application/usecases/UpdateRideUseCase';
import { CancelRideUseCase } from './application/usecases/CancelRideUseCase';
import { RideController } from './infrastructure/controllers/RideController';

export function createRideRoutes(): Router {
  const router = Router();

  const rideRepository = new RideRepository();
  const vehicleRepository = new VehicleRepository();
  const createRideUseCase = new CreateRideUseCase(rideRepository, vehicleRepository);
  const listRidesUseCase = new ListRidesUseCase(rideRepository);
  const getRideByIdUseCase = new GetRideByIdUseCase(rideRepository);
  const updateRideUseCase = new UpdateRideUseCase(rideRepository);
  const cancelRideUseCase = new CancelRideUseCase(rideRepository);

  const rideController = new RideController(
    createRideUseCase, listRidesUseCase, getRideByIdUseCase,
    updateRideUseCase, cancelRideUseCase,
  );

  // === Rutas públicas (requiere auth) ===
  router.get('/', authenticateToken, (req, res) => rideController.list(req, res));
  router.get('/my-rides', authenticateToken, (req, res) => rideController.getMyRides(req, res));
  router.get('/:id', authenticateToken, (req, res) => rideController.getById(req, res));
  router.post('/', authenticateToken, (req, res) => rideController.create(req, res));
  router.put('/:id', authenticateToken, (req, res) => rideController.update(req, res));
  router.put('/:id/cancel', authenticateToken, (req, res) => rideController.cancel(req, res));

  return router;
}
