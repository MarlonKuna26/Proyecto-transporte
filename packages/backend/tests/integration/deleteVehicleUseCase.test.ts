import { DeleteVehicleUseCase } from '../../src/modules/users/application/usecases/DeleteVehicleUseCase';
import { NotFoundError, AuthorizationError } from '@shared/errors/AppError';

describe('DeleteVehicleUseCase', () => {
  let useCase: DeleteVehicleUseCase;
  let mockVehicleRepository: any;

  beforeEach(() => {
    mockVehicleRepository = {
      findById: jest.fn(),
      delete: jest.fn(),
    };

    useCase = new DeleteVehicleUseCase(mockVehicleRepository);
  });

  it('Eliminar vehículo correctamente', async () => {
    mockVehicleRepository.findById.mockResolvedValue({
      id: '1',
      ownerId: 'user-1',
    });

    mockVehicleRepository.delete.mockResolvedValue(undefined);

    await useCase.execute({
      vehicleId: '1',
      ownerId: 'user-1',
    });

    expect(mockVehicleRepository.delete).toHaveBeenCalledWith('1');
  });

  it('Lanzar error si el vehículo no existe', async () => {
    mockVehicleRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        vehicleId: '1',
        ownerId: 'user-1',
      }),
    ).rejects.toThrow('Vehículo no encontrado');
  });

  it('Lanzar error si el usuario no es el propietario', async () => {
    mockVehicleRepository.findById.mockResolvedValue({
      id: '1',
      ownerId: 'user-2',
    });

    await expect(
      useCase.execute({
        vehicleId: '1',
        ownerId: 'user-1',
      }),
    ).rejects.toThrow('Solo puedes eliminar tus propios vehículos');
  });
});