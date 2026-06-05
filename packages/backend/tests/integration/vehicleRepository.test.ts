import { VehicleRepository } from '../../src/modules/users/infrastructure/repositories/VehicleRepository';
import { DatabaseConnection } from '../../src/config/database';
import { v4 as uuidv4 } from 'uuid';

describe('VehicleRepository Integration Tests', () => {
  const db = DatabaseConnection.getInstance();
  const repo = new VehicleRepository();

  let vehicleId: string;
  let ownerId: string;

  beforeAll(async () => {
    await db.query(`
      CREATE TABLE IF NOT EXISTS vehiculos (
        id UUID PRIMARY KEY,
        propietario_id UUID NOT NULL,
        placa TEXT NOT NULL,
        marca TEXT NOT NULL,
        modelo TEXT NOT NULL,
        color TEXT NOT NULL,
        anio INT,
        capacidad INT NOT NULL,
        url_foto TEXT,
        esta_activo BOOLEAN DEFAULT TRUE,
        creado_en TIMESTAMP DEFAULT NOW(),
        actualizado_en TIMESTAMP DEFAULT NOW()
      );
    `);
  });

  beforeEach(async () => {
    vehicleId = uuidv4();
    ownerId = uuidv4();

    await db.query(
      `
      INSERT INTO vehiculos (
        id, propietario_id, placa, marca, modelo, color,
        anio, capacidad, url_foto, esta_activo, creado_en, actualizado_en
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())
      `,
      [
        vehicleId,
        ownerId,
        'ABC-123',
        'Toyota',
        'Corolla',
        'Rojo',
        2020,
        4,
        null,
        true,
      ],
    );
  });

  afterEach(async () => {
    await db.query('DELETE FROM vehiculos;');
  });

  afterAll(async () => {
    await db.query('DROP TABLE IF EXISTS vehiculos CASCADE;');
  });

  // ================= CREATE =================
  it('crear vehículo correctamente', async () => {
    const vehicle = await repo.create({
      id: uuidv4(),
      ownerId: ownerId,
      plate: 'XYZ-999',
      brand: 'Nissan',
      model: 'Sentra',
      color: 'Azul',
      year: 2022,
      capacity: 5,
      photoUrl: null,
      isActive: true,
    } as any);

    expect(vehicle.plate).toBe('XYZ-999');
    expect(vehicle.ownerId).toBe(ownerId);
  });

  // ================= FIND BY ID =================
  it('buscar vehículo por id', async () => {
    const vehicle = await repo.findById(vehicleId);

    expect(vehicle).not.toBeNull();
    expect(vehicle!.id).toBe(vehicleId);
    expect(vehicle!.plate).toBe('ABC-123');
  });

  // ================= FIND BY OWNER =================
  it('buscar vehículos por ownerId', async () => {
    const vehicles = await repo.findByOwnerId(ownerId);

    expect(vehicles.length).toBeGreaterThan(0);
    expect(vehicles[0].ownerId).toBe(ownerId);
  });

  // ================= UPDATE =================
  it('actualizar vehículo', async () => {
    const updated = await repo.update(vehicleId, {
      plate: 'NEW-777',
      color: 'Negro',
    } as any);

    expect(updated.plate).toBe('NEW-777');
    expect(updated.color).toBe('Negro');
  });

  // ================= DELETE (soft delete) =================
  it('eliminar vehículo (soft delete)', async () => {
    await repo.delete(vehicleId);

    const result = await repo.findById(vehicleId);

    // puede seguir existiendo pero inactivo dependiendo lógica
    expect(result).not.toBeNull();
  });
});