import { DatabaseConnection } from '@config/database';
import { UserProfileRepository } from '../../src/modules/users/infrastructure/repositories/UserProfileRepository';

jest.mock('@config/database', () => {
  return {
    DatabaseConnection: {
      getInstance: jest.fn(),
    },
  };
});

describe('UserProfileRepository - Integration Tests', () => {
  const mockQuery = jest.fn();
  let repository: UserProfileRepository;

  beforeEach(() => {
    jest.clearAllMocks();

    (DatabaseConnection.getInstance as jest.Mock).mockReturnValue({
      query: mockQuery,
    });

    repository = new UserProfileRepository();
  });

  // ---------------------------
  // FIND BY USER ID
  // ---------------------------
  it('debe retornar perfil por userId', async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          id: '1',
          usuario_id: 'u1',
          carrera: 'Sistemas',
          url_foto: null,
          telefono: '123',
          zona: 'A',
          barrio: 'B',
          biografia: 'bio',
          contacto_emergencia: 'mama',
          telefono_emergencia: '999',
          url_qr_cuenta: 'qr',
          creado_en: new Date(),
          actualizado_en: new Date(),
        },
      ],
    });

    const result = await repository.findByUserId('u1');

    expect(mockQuery).toHaveBeenCalled();
    expect(result).not.toBeNull();
    expect(result!.userId).toBe('u1');
  });

  // ---------------------------
  // CREATE
  // ---------------------------
  it('debe crear perfil correctamente', async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          id: '1',
          usuario_id: 'u1',
          carrera: 'Sistemas',
          url_foto: null,
          telefono: '123',
          zona: 'A',
          barrio: 'B',
          biografia: 'bio',
          contacto_emergencia: 'mama',
          telefono_emergencia: '999',
          url_qr_cuenta: 'qr',
          creado_en: new Date(),
          actualizado_en: new Date(),
        },
      ],
    });

    const profile: any = {
      id: '1',
      userId: 'u1',
      career: 'Sistemas',
      photoUrl: null,
      phone: '123',
      zone: 'A',
      neighborhood: 'B',
      bio: 'bio',
      emergencyContact: 'mama',
      emergencyPhone: '999',
      accountQrUrl: 'qr',
    };

    const result = await repository.create(profile);

    expect(mockQuery).toHaveBeenCalled();
    expect(result.userId).toBe('u1');
  });

  // ---------------------------
  // UPDATE (con datos)
  // ---------------------------
  it('debe actualizar perfil con datos', async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          id: '1',
          usuario_id: 'u1',
          carrera: 'Updated',
          url_foto: null,
          telefono: '123',
          zona: 'A',
          barrio: 'B',
          biografia: 'bio',
          contacto_emergencia: 'mama',
          telefono_emergencia: '999',
          url_qr_cuenta: 'qr',
          creado_en: new Date(),
          actualizado_en: new Date(),
        },
      ],
    });

    const result = await repository.update('u1', {
      career: 'Updated',
      phone: '999',
    } as any);

    expect(mockQuery).toHaveBeenCalled();
    expect(result.career).toBe('Updated');
  });

  // ---------------------------
  // UPDATE sin cambios (branch crítico)
  // ---------------------------
  it('debe retornar existente si no hay cambios', async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          id: '1',
          usuario_id: 'u1',
          carrera: 'Sistemas',
          url_foto: null,
          telefono: '123',
          zona: 'A',
          barrio: 'B',
          biografia: 'bio',
          contacto_emergencia: 'mama',
          telefono_emergencia: '999',
          url_qr_cuenta: 'qr',
          creado_en: new Date(),
          actualizado_en: new Date(),
        },
      ],
    });

    const result = await repository.update('u1', {} as any);

    expect(result).not.toBeNull();
    expect(mockQuery).toHaveBeenCalled(); // findByUserId
  });
});