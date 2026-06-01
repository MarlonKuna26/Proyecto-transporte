import { UserProfile } from '../entities/UserProfile';

export interface IUserProfileRepository {
  findByUserId(userId: string): Promise<UserProfile | null>;
  create(profile: UserProfile): Promise<UserProfile>;
  update(userId: string, data: Partial<UserProfile>): Promise<UserProfile>;
}
