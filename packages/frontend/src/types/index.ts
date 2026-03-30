/**
 * Tipos Frontend — alineados con el backend
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
  title: string;
  description: string;
  icon: string;
  display_order: number;
}

export interface Payment {
  id: string;
  ride_id: string;
  passenger_id: string;
  driver_id: string;
  amount: number;
  payment_method: string;
  status: string;
  reference: string | null;
  paid_at: string | null;
  created_at: string;
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
