import { v4 as uuidv4 } from 'uuid';

/**
 * Entidad Ride - Capa de dominio (RF3)
 */
export type RideStatus = 'PUBLISHED' | 'FULL' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export class Ride {
  readonly id: string;
  readonly driverId: string;
  readonly vehicleId: string | null;
  readonly originZone: string;
  readonly originDetail: string | null;
  readonly destinationZone: string;
  readonly destinationDetail: string | null;
  readonly departureDate: string; // YYYY-MM-DD
  readonly departureTime: string; // HH:MM
  readonly availableSeats: number;
  readonly pricePerSeat: number;
  readonly status: RideStatus;
  readonly notes: string | null;
  readonly rules: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(
    driverId: string,
    originZone: string,
    destinationZone: string,
    departureDate: string,
    departureTime: string,
    availableSeats: number,
    pricePerSeat: number = 0,
    vehicleId: string | null = null,
    originDetail: string | null = null,
    destinationDetail: string | null = null,
    notes: string | null = null,
    rules: string | null = null,
    status: RideStatus = 'PUBLISHED',
    id: string = uuidv4(),
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ) {
    this.id = id;
    this.driverId = driverId;
    this.vehicleId = vehicleId;
    this.originZone = originZone;
    this.originDetail = originDetail;
    this.destinationZone = destinationZone;
    this.destinationDetail = destinationDetail;
    this.departureDate = departureDate;
    this.departureTime = departureTime;
    this.availableSeats = availableSeats;
    this.pricePerSeat = pricePerSeat;
    this.status = status;
    this.notes = notes;
    this.rules = rules;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  isAvailable(): boolean {
    return this.status === 'PUBLISHED' && this.availableSeats > 0;
  }

  isFull(): boolean {
    return this.availableSeats <= 0;
  }
}
