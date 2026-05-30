/**
 * DTOs para vehículos
 */

export class CreateVehicleDTO {
  plate: string;
  brand: string;
  model: string;
  color: string;
  year?: number;
  capacity: number;
  photoUrl?: string;

  constructor(data: any) {
    this.plate = data.plate;
    this.brand = data.brand;
    this.model = data.model;
    this.color = data.color;
    this.year = data.year;
    this.capacity = data.capacity || 4;
    this.photoUrl = data.photoUrl;
    this.validate();
  }

  private validate(): void {
    if (!this.plate || !this.brand || !this.model || !this.color) {
      throw new Error('La placa, marca, modelo y color son obligatorios');
    }
    if (this.capacity < 1 || this.capacity > 8) {
      throw new Error('La capacidad debe estar entre 1 y 8');
    }
  }
}

export class UpdateVehicleDTO {
  plate?: string;
  brand?: string;
  model?: string;
  color?: string;
  year?: number;
  capacity?: number;
  photoUrl?: string;

  constructor(data: any) {
    if (data.plate) this.plate = data.plate;
    if (data.brand) this.brand = data.brand;
    if (data.model) this.model = data.model;
    if (data.color) this.color = data.color;
    if (data.year !== undefined) this.year = data.year;
    if (data.capacity !== undefined) this.capacity = data.capacity;
    if (data.photoUrl) this.photoUrl = data.photoUrl;
  }
}
