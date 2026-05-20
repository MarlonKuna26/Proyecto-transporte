/**
 * DTOs para viajes
 */

export class CreateRideDTO {
  originZone: string;
  originDetail?: string;
  destinationZone: string;
  destinationDetail?: string;
  departureDate: string;
  departureTime: string;
  availableSeats: number;
  pricePerSeat: number;
  vehicleId?: string;
  notes?: string;
  rules?: string;

  constructor(data: any) {
    this.originZone = data.originZone;
    this.originDetail = data.originDetail;
    this.destinationZone = data.destinationZone;
    this.destinationDetail = data.destinationDetail;
    this.departureDate = data.departureDate;
    this.departureTime = data.departureTime;
    this.availableSeats = data.availableSeats;
    this.pricePerSeat = data.pricePerSeat || 0;
    this.vehicleId = data.vehicleId;
    this.notes = data.notes;
    this.rules = data.rules;
    this.validate();
  }

  private validate(): void {
    if (!this.originZone) throw new Error('Origin zone is required');
    if (!this.destinationZone) throw new Error('Destination zone is required');
    if (!this.departureDate) throw new Error('Departure date is required');
    if (!this.departureTime) throw new Error('Departure time is required');
    if (!this.availableSeats || this.availableSeats < 1) throw new Error('Available seats must be at least 1');
    if (this.pricePerSeat < 0) throw new Error('Price per seat cannot be negative');
  }
}

export class UpdateRideDTO {
  originZone?: string;
  originDetail?: string;
  destinationZone?: string;
  destinationDetail?: string;
  departureDate?: string;
  departureTime?: string;
  availableSeats?: number;
  pricePerSeat?: number;
  vehicleId?: string;
  notes?: string;
  rules?: string;
  status?: string;

  constructor(data: any) {
    Object.assign(this, data);
  }
}

export class RideFilterDTO {
  originZone?: string;
  destinationZone?: string;
  departureDate?: string;
  status?: string;
    driverId?: string;

  page: number;
  limit: number;

  constructor(data: any) {
    this.originZone = data.originZone;
    this.destinationZone = data.destinationZone;
    this.departureDate = data.departureDate;
    this.status = data.status;
    this.driverId = data.driverId;
    this.page = parseInt(data.page) || 1;
    this.limit = Math.min(parseInt(data.limit) || 20, 50);
  }
}
