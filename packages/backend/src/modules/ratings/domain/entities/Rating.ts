import { v4 as uuidv4 } from 'uuid';

export class Rating {
  readonly id: string;
  readonly rideId: string;
  readonly raterId: string;
  readonly ratedId: string;
  readonly score: number;
  readonly comment: string | null;
  readonly roleInRide: 'DRIVER' | 'PASSENGER';
  readonly createdAt: Date;

  constructor(
    rideId: string,
    raterId: string,
    ratedId: string,
    score: number,
    roleInRide: 'DRIVER' | 'PASSENGER',
    comment: string | null = null,
    id: string = uuidv4(),
    createdAt: Date = new Date(),
  ) {
    if (score < 1 || score > 5) throw new Error('La puntuación debe estar entre 1 y 5');
    this.id = id;
    this.rideId = rideId;
    this.raterId = raterId;
    this.ratedId = ratedId;
    this.score = score;
    this.comment = comment;
    this.roleInRide = roleInRide;
    this.createdAt = createdAt;
  }
}
