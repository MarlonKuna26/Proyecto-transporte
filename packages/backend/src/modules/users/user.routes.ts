import { Router } from 'express';
import { authenticateToken } from '@shared/middlewares/AuthMiddleware';
import { UserRepository } from '@modules/auth/infrastructure/repositories/UserRepository';
import { UserProfileRepository } from './infrastructure/repositories/UserProfileRepository';
import { VehicleRepository } from './infrastructure/repositories/VehicleRepository';
import { GetProfileUseCase } from './application/usecases/GetProfileUseCase';
import { UpdateProfileUseCase } from './application/usecases/UpdateProfileUseCase';
import { CreateVehicleUseCase } from './application/usecases/CreateVehicleUseCase';
import { GetUserVehiclesUseCase } from './application/usecases/GetUserVehiclesUseCase';
import { DeleteVehicleUseCase } from './application/usecases/DeleteVehicleUseCase';
import { UpdateVehicleUseCase } from './application/usecases/UpdateVehicleUseCase';
import { UserController } from './infrastructure/controllers/UserController';

export function createUserRoutes(): Router {
  const router = Router();

  // === Inyección de Dependencias ===
  const userRepository = new UserRepository();
  const profileRepository = new UserProfileRepository();
  const vehicleRepository = new VehicleRepository();

  const getProfileUseCase = new GetProfileUseCase(profileRepository, userRepository);
  const updateProfileUseCase = new UpdateProfileUseCase(profileRepository, userRepository);
  const createVehicleUseCase = new CreateVehicleUseCase(vehicleRepository);
  const getUserVehiclesUseCase = new GetUserVehiclesUseCase(vehicleRepository);
  const deleteVehicleUseCase = new DeleteVehicleUseCase(vehicleRepository);
  const updateVehicleUseCase = new UpdateVehicleUseCase(vehicleRepository);

  const userController = new UserController(
    getProfileUseCase, updateProfileUseCase,
    createVehicleUseCase, getUserVehiclesUseCase, deleteVehicleUseCase,
    updateVehicleUseCase
  );

  // === Rutas de Perfil (protegidas) ===
  router.get('/profile', authenticateToken, (req, res) => userController.getProfile(req, res));
  router.get('/profile/:userId', authenticateToken, (req, res) => userController.getProfile(req, res));
  router.put('/profile', authenticateToken, (req, res) => userController.updateProfile(req, res));

  // === Rutas de Vehículos (protegidas) ===
  router.post('/vehicles', authenticateToken, (req, res) => userController.createVehicle(req, res));
  router.get('/vehicles', authenticateToken, (req, res) => userController.getMyVehicles(req, res));
  router.delete('/vehicles/:vehicleId', authenticateToken, (req, res) => userController.deleteVehicle(req, res));
  router.put('/vehicles/:vehicleId', authenticateToken, (req, res) => userController.updateVehicle(req, res));

  return router;
}
