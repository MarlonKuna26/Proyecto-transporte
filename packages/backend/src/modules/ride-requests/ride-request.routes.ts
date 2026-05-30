import { Router } from 'express';
import { authenticateToken, authorizeRole } from '@shared/middlewares/AuthMiddleware';
import { RideRequestRepository } from './infrastructure/repositories/RideRequestRepository';
import { RideRepository } from '@modules/rides/infrastructure/repositories/RideRepository';
import { RequestJoinUseCase } from './application/usecases/RequestJoinUseCase';
import { AcceptRequestUseCase } from './application/usecases/AcceptRequestUseCase';
import { RejectRequestUseCase } from './application/usecases/RejectRequestUseCase';
import { ListRequestsUseCase } from './application/usecases/ListRequestsUseCase';
import { CancelRequestUseCase } from './application/usecases/CancelRequestUseCase';
import { RideRequestController } from './infrastructure/controllers/RideRequestController';

export function createRideRequestRoutes(): Router {
  const router = Router();

  const requestRepo = new RideRequestRepository();
  const rideRepo = new RideRepository();

  const requestJoinUseCase = new RequestJoinUseCase(requestRepo, rideRepo);
  const acceptRequestUseCase = new AcceptRequestUseCase(requestRepo, rideRepo);
  const rejectRequestUseCase = new RejectRequestUseCase(requestRepo, rideRepo);
  //const listRequestsUseCase = new ListRequestsUseCase(requestRepo);
  const listRequestsUseCase = new ListRequestsUseCase(
  requestRepo,
  rideRepo
);
  const cancelRequestUseCase = new CancelRequestUseCase(requestRepo, rideRepo);

  const controller = new RideRequestController(
    requestJoinUseCase, acceptRequestUseCase, rejectRequestUseCase,
    listRequestsUseCase, cancelRequestUseCase,
  );

  // Solicitar unirse a un viaje
  router.post('/', authenticateToken, authorizeRole('STUDENT'), (req, res) => controller.requestJoin(req, res));

  // Mis solicitudes (como pasajero)
  router.get('/my-requests', authenticateToken, authorizeRole('STUDENT'), (req, res) => controller.listMyRequests(req, res));
router.get('/ride/:rideId/passengers', authenticateToken, authorizeRole('STUDENT'), (req, res) => 
  controller.getAcceptedPassengers(req, res)
);
  // Solicitudes de un viaje (para conductor)
  router.get('/ride/:rideId', authenticateToken, authorizeRole('STUDENT'), (req, res) => controller.listByRide(req, res));

  // Aceptar/Rechazar/Cancelar
  router.put('/:id/accept', authenticateToken, authorizeRole('STUDENT'), (req, res) => controller.accept(req, res));
  router.put('/:id/reject', authenticateToken, authorizeRole('STUDENT'), (req, res) => controller.reject(req, res));
  router.put('/:id/cancel', authenticateToken, authorizeRole('STUDENT'), (req, res) => controller.cancel(req, res));
// Pasajeros aceptados de un viaje (cualquier usuario autenticado)

  return router;
}
