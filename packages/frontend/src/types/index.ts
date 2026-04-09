/**
 * Tipos Frontend — alineados con el backend (u_ride_esp)
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'ADMIN';
  isVerified: boolean;
  reputation: number;
}

export interface UserProfile {
  userId: string;
  email: string;
  name: string;
  role: string;
  reputation: number;
  totalRatings: number;
  isVerified: boolean;
  career: string | null;
  photoUrl: string | null;
  phone: string | null;
  zone: string | null;
  neighborhood: string | null;
  bio: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
}

export interface Vehicle {
  id: string;
  ownerId: string;
  plate: string;
  brand: string;
  model: string;
  color: string;
  year: number | null;
  capacity: number;
  photoUrl: string | null;
  isActive: boolean;
}

export interface Ride {
  id: string;
  driverId: string;
  vehicleId: string | null;
  originZone: string;
  originDetail: string | null;
  destinationZone: string;
  destinationDetail: string | null;
  departureDate: string;
  departureTime: string;
  availableSeats: number;
  pricePerSeat: number;
  status: 'PUBLISHED' | 'FULL' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes: string | null;
  rules: string | null;
  createdAt: string;
  // GPS coordinates
  originLat: number | null;
  originLng: number | null;
  destinationLat: number | null;
  destinationLng: number | null;
  actualStart: string | null;
  actualEnd: string | null;
}

export interface RideRequest {
  id: string;
  rideId: string;
  passengerId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  message: string | null;
  seatsRequested: number;
  respondedAt: string | null;
  createdAt: string;
}

export interface Rating {
  id: string;
  rideId: string;
  raterId: string;
  ratedId: string;
  score: number;
  comment: string | null;
  roleInRide: 'DRIVER' | 'PASSENGER';
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedId: string;
  rideId: string | null;
  reason: string;
  description: string;
  evidenceUrl: string | null;
  status: 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
  adminNotes: string | null;
  resolvedBy: string | null;
  createdAt: string;
}

export interface SecurityRule {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string;
  orden_mostrado: number;
}

export interface Payment {
  id: string;
  solicitud_viaje_id: string;
  viaje_id?: string;
  pasajero_id?: string;
  conductor_id?: string;
  monto: number;
  metodo_pago: 'CASH' | 'TRANSFER' | 'WALLET';
  estado: 'PENDING' | 'COMPLETED' | 'REFUNDED' | 'FAILED';
  referencia_transaccion: string | null;
  creado_en: string;
  actualizado_en: string;
  // Joined fields
  zona_origen?: string;
  zona_destino?: string;
  fecha_salida?: string;
  hora_salida?: string;
  nombre_pasajero?: string;
}

export interface TrackingPoint {
  id: string;
  viaje_id: string;
  latitud_actual: number;
  longitud_actual: number;
  rumbo: number | null;
  velocidad: number | null;
  ultima_actualizacion: string;
}

export interface TrackingHistoryPoint {
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  timestamp: string;
}

export interface RideEvent {
  id: string;
  viaje_id: string;
  tipo_evento: string;
  descripcion: string;
  creado_en: string;
}

export interface PaymentSummary {
  sent: {
    total: string;
    monto_total: string;
    completados: string;
    pendientes: string;
  };
  received: {
    total: string;
    monto_total: string;
    completados: string;
    pendientes: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
