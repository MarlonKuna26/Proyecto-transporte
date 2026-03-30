import { v4 as uuidv4 } from 'uuid';

export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export class RideRequest {
  readonly id: string;
  readonly rideId: string;
  readonly passengerId: string;
  readonly status: RequestStatus;
  readonly message: string | null;
  readonly seatsRequested: number;
  readonly respondedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(
    rideId: string,
    passengerId: string,
    seatsRequested: number = 1,
    message: string | null = null,
    status: RequestStatus = 'PENDING',
    respondedAt: Date | null = null,
    id: string = uuidv4(),
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ) {
    this.id = id;
    this.rideId = rideId;
    this.passengerId = passengerId;
    this.status = status;
    this.message = message;
    this.seatsRequested = seatsRequested;
    this.respondedAt = respondedAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
