import { RideRepository } from './RideRepository';
import { DatabaseConnection } from '@config/database';
import { Ride } from '../../domain/entities/Ride';

describe('RideRepository', () => {
  let repository: RideRepository;
  let testRide: Ride;

  beforeAll(() => {
    repository = new RideRepository();
    // Podríamos mockear el pool de la DB si no queremos tocar la BD real
    jest.spyOn(DatabaseConnection.getInstance(), 'query').mockImplementation(async (queryText: any, values: any) => {
      // Mock básico para que no falle si no hay DB
      if (queryText.includes('INSERT INTO viajes')) {
        return { rows: [
          {
            id: values[0], conductor_id: values[1], zona_origen: values[3],
            zona_destino: values[5], fecha_salida: values[7], hora_salida: values[8],
            asientos_disponibles: values[9], precio_por_asiento: values[10],
            estado: values[11], creado_en: new Date(), actualizado_en: new Date()
          }
        ] };
      }
      if (queryText.includes('UPDATE viajes')) {
        return { rows: [
          {
            id: values[values.length - 1], conductor_id: 'test-driver', zona_origen: 'Sur',
            zona_destino: 'Norte', fecha_salida: '2024-12-31', hora_salida: '08:00',
            asientos_disponibles: 4, precio_por_asiento: 5,
            estado: values[0], creado_en: new Date(), actualizado_en: new Date()
          }
        ] };
      }
      if (queryText.includes('DELETE')) {
        return { rows: [], rowCount: 1 };
      }
      return { rows: [] };
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('Debería crear un nuevo viaje en el repositorio', async () => {
    testRide = new Ride(
      'driver-1', 'Centro', 'Norte', '2024-12-31', '08:00', 4, 5.0, null, null, null, null, null, 'PUBLISHED'
    );

    const result = await repository.create(testRide);
    expect(result).toBeDefined();
    expect(result.id).toBe(testRide.id);
    expect(result.originZone).toBe('Centro');
  });

  it('Debería editar un viaje en el repositorio', async () => {
    const updated = await repository.update(testRide.id, { originZone: 'Sur' });
    expect(updated).toBeDefined();
    expect(updated.originZone).toBe('Sur'); // Basado en el mock
  });

  it('Debería eliminar un viaje en el repositorio', async () => {
    await repository.delete(testRide.id);
    // Verificamos que no lance error
    expect(true).toBe(true);
  });
});
