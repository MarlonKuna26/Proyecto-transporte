import { UpdateVehicleUseCase } from '../../src/modules/users/application/usecases/UpdateVehicleUseCase';
import { UpdateVehicleDTO } from '../../src/modules/users/application/dtos/VehicleDTO';
import { NotFoundError, AuthorizationError } from '@shared/errors/AppError';

describe('UpdateVehicleUseCase', () => {
  let useCase: UpdateVehicleUseCase;
  let mockVehicleRepository: any;

  beforeEach(() => {
    mockVehicleRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    useCase = new UpdateVehicleUseCase(mockVehicleRepository);
  });

  it('Actualizar vehículo correctamente', async () => {
    mockVehicleRepository.findById.mockResolvedValue({
      id: '1',
      ownerId: 'user-1',
    });

    mockVehicleRepository.update.mockResolvedValue({
      id: '1',
      plate: 'ABC-123',
      brand: 'Toyota',
    });

    const dto = new UpdateVehicleDTO({
      plate: 'ABC-123',
      brand: 'Toyota',
    });

    const result = await useCase.execute('user-1', '1', dto);

    expect(result.id).toBe('1');
    expect(result.plate).toBe('ABC-123');
    expect(mockVehicleRepository.update).toHaveBeenCalledWith('1', dto);
  });

  it('Lanzar error si el vehículo no existe', async () => {
    mockVehicleRepository.findById.mockResolvedValue(null);

    const dto = new UpdateVehicleDTO({
      plate: 'ABC-123',
    });

    await expect(
      useCase.execute('user-1', '1', dto),
    ).rejects.toThrow('Vehículo no encontrado');
  });

  it('Lanzar error si no es el dueño del vehículo', async () => {
    mockVehicleRepository.findById.mockResolvedValue({
      id: '1',
      ownerId: 'user-2',
    });

    const dto = new UpdateVehicleDTO({
      plate: 'ABC-123',
    });

    await expect(
      useCase.execute('user-1', '1', dto),
    ).rejects.toThrow('No eres el dueño de este vehículo');
  });
});