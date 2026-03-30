import { Rating } from '../entities/Rating';

export interface IRatingRepository {
  create(rating: Rating): Promise<Rating>;
  findByRatedId(ratedId: string): Promise<Rating[]>;
  findByRideId(rideId: string): Promise<Rating[]>;
  findByRaterAndRide(raterId: string, rideId: string, ratedId: string): Promise<Rating | null>;
  getAverageAndCount(userId: string): Promise<{ average: number; count: number }>;
}
