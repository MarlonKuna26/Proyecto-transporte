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
    if (!this.rideId) throw new Error('Ride ID is required');
    if (!this.ratedId) throw new Error('Rated user ID is required');
    if (!this.score || this.score < 1 || this.score > 5) throw new Error('Score must be between 1 and 5');
  }
}
