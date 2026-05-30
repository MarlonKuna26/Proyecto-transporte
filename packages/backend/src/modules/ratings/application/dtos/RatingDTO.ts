export class CreateRatingDTO {
  rideId: string;
  ratedId: string;
  score: number;
  comment?: string;

  constructor(data: any) {
    this.rideId = data.rideId;
    this.ratedId = data.ratedId;
    this.score = data.score;
    this.comment = data.comment;
    this.validate();
  }

  private validate(): void {
    if (!this.rideId) throw new Error('El ID del viaje es obligatorio');
    if (!this.ratedId) throw new Error('El ID del usuario calificado es obligatorio');
    if (!this.score || this.score < 1 || this.score > 5) throw new Error('La puntuación debe estar entre 1 y 5');
  }
}
