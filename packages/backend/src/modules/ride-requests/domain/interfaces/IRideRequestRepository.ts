import { RideRequest } from '../entities/RideRequest';

export interface IRideRequestRepository {
  create(request: RideRequest): Promise<RideRequest>;
  findById(id: string): Promise<RideRequest | null>;
  findByRideId(rideId: string): Promise<RideRequest[]>;
  findByPassengerId(passengerId: string): Promise<RideRequest[]>;
  findByRideAndPassenger(rideId: string, passengerId: string): Promise<RideRequest | null>;
  update(id: string, data: Partial<RideRequest>): Promise<RideRequest>;
  countAcceptedByRide(rideId: string): Promise<number>;
}
