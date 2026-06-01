import { Ride, RideStatus } from '../entities/Ride';

export interface RideFilters {
  originZone?: string;
  destinationZone?: string;
  departureDate?: string;
  status?: RideStatus;
  driverId?: string;
}

export interface IRideRepository {
  create(ride: Ride): Promise<Ride>;
  findById(id: string): Promise<Ride | null>;
  findAll(filters?: RideFilters, limit?: number, offset?: number): Promise<Ride[]>;
  countAll(filters?: RideFilters): Promise<number>;
  findByDriverId(driverId: string): Promise<Ride[]>;
  update(id: string, data: Partial<Ride>): Promise<Ride>;
  updateSeats(id: string, seatsDelta: number): Promise<Ride>;
  delete(id: string): Promise<void>;
}
