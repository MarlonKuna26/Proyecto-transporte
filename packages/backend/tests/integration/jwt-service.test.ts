// tests/integration/jwt-service.test.ts

import { JWTService } from '../../src/shared/services/JWTService';

describe('JWTService Integration', () => {
  const payload = {
    userId: '123',
    email: 'test@uta.edu.ec',
    role: 'STUDENT' as const,
  };

  it('debe generar y validar access y refresh token', () => {
    const tokens = JWTService.generateTokenPair(payload);

    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();

    const accessDecoded =
      JWTService.validateAccessToken(tokens.accessToken);

    const refreshDecoded =
      JWTService.validateRefreshToken(tokens.refreshToken);

    expect(accessDecoded.userId).toBe(payload.userId);
    expect(accessDecoded.email).toBe(payload.email);

    expect(refreshDecoded.userId).toBe(payload.userId);
    expect(refreshDecoded.email).toBe(payload.email);
  });

  it('debe generar un nuevo access token', () => {
    const token = JWTService.generateAccessToken(payload);

    const decoded =
      JWTService.validateAccessToken(token);

    expect(decoded.userId).toBe(payload.userId);
  });

  it('debe decodificar un token', () => {
    const token =
      JWTService.generateAccessToken(payload);

    const decoded = JWTService.decode(token);

    expect(decoded).not.toBeNull();
    expect(decoded?.email).toBe(payload.email);
  });

  it('debe lanzar error con access token inválido', () => {
    expect(() =>
      JWTService.validateAccessToken('token-falso')
    ).toThrow(
      'Token de acceso inválido o expirado'
    );
  });

  it('debe lanzar error con refresh token inválido', () => {
    expect(() =>
      JWTService.validateRefreshToken('token-falso')
    ).toThrow(
      'Token de actualización inválido o expirado'
    );
  });

  it('debe retornar null al decodificar token inválido', () => {
    const decoded =
      JWTService.decode('token-falso');

    expect(decoded).toBeNull();
  });
});