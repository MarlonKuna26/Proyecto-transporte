export class CreateRideRequestDTO {
  rideId: string;
  message?: string;
  seatsRequested: number;

  constructor(data: any) {
    this.rideId = data.rideId;
    this.message = data.message;
    this.seatsRequested = data.seatsRequested || 1;
    this.validate();
  }

  private validate(): void {
    if (!this.rideId) throw new Error('El ID del viaje es obligatorio');
    if (this.seatsRequested < 1) throw new Error('Los asientos solicitados deben ser al menos 1');
  }
}
