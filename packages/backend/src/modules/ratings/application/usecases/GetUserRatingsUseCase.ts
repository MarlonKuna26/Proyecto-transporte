import { IUseCase } from '@shared/types';
import { IRatingRepository } from '../../domain/interfaces/IRatingRepository';
import { Rating } from '../../domain/entities/Rating';

export class GetUserRatingsUseCase implements IUseCase<string, { ratings: Rating[]; average: number; count: number }> {
  constructor(private ratingRepo: IRatingRepository) {}

  async execute(userId: string): Promise<{ ratings: Rating[]; average: number; count: number }> {
    const [ratings, stats] = await Promise.all([
      this.ratingRepo.findByRatedId(userId),
      this.ratingRepo.getAverageAndCount(userId),
    ]);

    return {
      ratings,
      average: stats.average,
      count: stats.count,
    };
  }
}
