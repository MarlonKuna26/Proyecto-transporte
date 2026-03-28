/**
 * Tipos Frontend
 * Tipos específicos del cliente que no son compartidos
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'ADMIN';
  isVerified: boolean;
  reputation: number;
}

export interface Ride {
  id: string;
  driverId: string;
  driver: {
    id: string;
    name: string;
    reputation: number;
  };
  departureLocation: string;
  destinationLocation: string;
  departureTime: Date;
  availableSeats: number;
  fare: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  passengers: User[];
}

export interface RideRequest {
  id: string;
  rideId: string;
  passengerId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  createdAt: Date;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}
