import { v4 as uuidv4 } from 'uuid';

/**
 * Entidad Vehicle - Capa de dominio
 */
export class Vehicle {
  readonly id: string;
  readonly ownerId: string;
  readonly plate: string;
  readonly brand: string;
  readonly model: string;
  readonly color: string;
  readonly year: number | null;
  readonly capacity: number;
  readonly photoUrl: string | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(
    ownerId: string,
    plate: string,
    brand: string,
    model: string,
    color: string,
    capacity: number = 4,
    year: number | null = null,
    photoUrl: string | null = null,
    isActive: boolean = true,
    id: string = uuidv4(),
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ) {
    this.id = id;
    this.ownerId = ownerId;
    this.plate = plate;
    this.brand = brand;
    this.model = model;
    this.color = color;
    this.year = year;
    this.capacity = capacity;
    this.photoUrl = photoUrl;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
