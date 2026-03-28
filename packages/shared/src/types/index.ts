/**
 * Shared Types - Tipos reutilizables en todo el proyecto
 */

/**
 * Interface IUseCase
 * Patrón Use Case - Define la estructura de un caso de uso
 */
export interface IUseCase<Input, Output> {
  execute(input: Input): Promise<Output>;
}

/**
 * Tipos de Usuario
 */
export type UserRole = 'STUDENT' | 'ADMIN';

export interface IUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isVerified: boolean;
  reputation: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tipos de Viajes (Rides)
 */
export type RideStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface IRide {
  id: string;
  driverId: string;
  departureLocation: string;
  destinationLocation: string;
  departureTime: Date;
  availableSeats: number;
  fare: number;
  status: RideStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tipos de Solicitudes de Viaje
 */
export type RideRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export interface IRideRequest {
  id: string;
  rideId: string;
  passengerId: string;
  status: RideRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tipos de Respuesta API
 */
export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

/**
 * Tipos de Paginación
 */
export interface IPaginationQuery {
  page: number;
  limit: number;
  offset: number;
}

export interface IPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
