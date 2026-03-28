/**
 * JWT Service
 * Maneja la generación y validación de tokens JWT
 *
 * Patrón: Service (infraestructura)
 * Esta es una abstracción sobre la librería jsonwebtoken
 * para que el código esté desacoplado
 */

import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
  iat?: number;
  exp?: number;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class JWTService {
  private static readonly ACCESS_SECRET: string = (process.env.JWT_SECRET || 'super-secret-key-change-in-production') as string;
  private static readonly REFRESH_SECRET: string = (process.env.JWT_REFRESH_SECRET || 'super-refresh-secret-change-in-production') as string;
  private static readonly ACCESS_EXPIRES: string = (process.env.JWT_EXPIRATION || '7d') as string;
  private static readonly REFRESH_EXPIRES: string = (process.env.JWT_REFRESH_EXPIRATION || '30d') as string;

  /**
   * Generar pair de tokens (access + refresh)
   */
  static generateTokenPair(payload: Omit<JWTPayload, 'iat' | 'exp'>): TokenPair {
    const accessToken = jwt.sign(payload, this.ACCESS_SECRET, {
      expiresIn: this.ACCESS_EXPIRES,
    } as any);

    const refreshToken = jwt.sign(payload, this.REFRESH_SECRET, {
      expiresIn: this.REFRESH_EXPIRES,
    } as any);

    return { accessToken, refreshToken };
  }

  /**
   * Validar access token
   */
  static validateAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.ACCESS_SECRET) as JWTPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  /**
   * Validar refresh token
   */
  static validateRefreshToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.REFRESH_SECRET) as JWTPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Generar solo access token (usado al hacer refresh)
   */
  static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.ACCESS_SECRET, {
      expiresIn: this.ACCESS_EXPIRES,
    } as any);
  }

  /**
   * Decodificar sin validar (útil para debugging)
   */
  static decode(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch {
      return null;
    }
  }
}


