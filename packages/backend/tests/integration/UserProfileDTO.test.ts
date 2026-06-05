import {
  UpdateProfileDTO,
  ProfileResponseDTO,
} from '../../src/modules/users/application/dtos/UserProfileDTO';

describe('UserProfileDTO - Integration', () => {
  // -------------------------
  // UpdateProfileDTO flujo real
  // -------------------------
  it('debe integrarse correctamente en flujo de actualización de perfil', () => {
    const input = {
      career: 'Sistemas',
      phone: '1234567890',
      bio: 'Estudiante activo',
    };

    const dto = new UpdateProfileDTO(input);

    // Simula uso real en service/repository
    expect(dto.career).toBe(input.career);
    expect(dto.phone).toBe(input.phone);
    expect(dto.bio).toBe(input.bio);
  });

  // -------------------------
  // ProfileResponseDTO flujo real (mapper de salida API)
  // -------------------------
  it('debe mapear respuesta completa como en API real', () => {
    const rawFromDbOrService = {
      userId: 'u1',
      email: 'test@mail.com',
      name: 'Juan',
      role: 'STUDENT',
      reputation: 4.8,
      totalRatings: 5,
      isVerified: true,
      career: 'Sistemas',
      photoUrl: 'foto.png',
      phone: '999',
      zone: 'Zona 1',
      neighborhood: 'Centro',
      bio: 'Bio test',
      emergencyContact: 'Madre',
      emergencyPhone: '111',
      accountQrUrl: 'qr.png',
    };

    const response = new ProfileResponseDTO(rawFromDbOrService);

    // Simula respuesta real de endpoint GET /profile
    expect(response.userId).toBe('u1');
    expect(response.email).toBe('test@mail.com');
    expect(response.name).toBe('Juan');
    expect(response.role).toBe('STUDENT');
  });

  // -------------------------
  // integración con valores incompletos (caso real API)
  // -------------------------
  it('debe manejar datos incompletos como vendrían del backend', () => {
    const partialData = {
      userId: 'u2',
      email: 'mail@test.com',
      name: 'Ana',
      role: 'STUDENT',
      reputation: 0,
      isVerified: false,
    };

    const response = new ProfileResponseDTO(partialData);

    expect(response.totalRatings).toBe(0); // comportamiento real backend
    expect(response.career).toBeUndefined();
    expect(response.phone).toBeUndefined();
  });

  // -------------------------
  // integración null DB → DTO
  // -------------------------
  it('debe soportar valores null provenientes de base de datos', () => {
    const dbResult = {
      userId: 'u3',
      email: 'x@mail.com',
      name: 'Luis',
      role: 'ADMIN',
      reputation: 5,
      totalRatings: 2,
      isVerified: true,
      career: null,
      photoUrl: null,
      phone: null,
      zone: null,
      neighborhood: null,
      bio: null,
      emergencyContact: null,
      emergencyPhone: null,
      accountQrUrl: null,
    };

    const response = new ProfileResponseDTO(dbResult);

    expect(response.career).toBeNull();
    expect(response.photoUrl).toBeNull();
    expect(response.phone).toBeNull();
  });
});