import { IUseCase } from '@shared/types';
import { IRatingRepository } from '../../domain/interfaces/IRatingRepository';
import { Rating } from '../../domain/entities/Rating';

export class GetGivenRatingsUseCase implements IUseCase<string, Rating[]> {
  constructor(private ratingRepo: IRatingRepository) {}

  async execute(raterId: string): Promise<Rating[]> {
    return this.ratingRepo.findByRaterId(raterId);
  }
}
