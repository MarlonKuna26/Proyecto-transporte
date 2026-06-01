import { IUseCase } from '@shared/types';
import { IUserProfileRepository } from '../../domain/interfaces/IUserProfileRepository';
import { IUserRepository } from '@modules/auth/domain/interfaces/IUserRepository';
import { ProfileResponseDTO } from '../dtos/UserProfileDTO';
import { NotFoundError } from '@shared/errors/AppError';

export class GetProfileUseCase implements IUseCase<string, ProfileResponseDTO> {
  constructor(
    private userProfileRepository: IUserProfileRepository,
    private userRepository: IUserRepository,
  ) {}

  async execute(userId: string): Promise<ProfileResponseDTO> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    const profile = await this.userProfileRepository.findByUserId(userId);

    return new ProfileResponseDTO({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      reputation: user.reputation,
      totalRatings: (user as any).totalRatings || 0,
      isVerified: user.isVerified,
      career: profile?.career || null,
      photoUrl: profile?.photoUrl || null,
      phone: profile?.phone || null,
      zone: profile?.zone || null,
      neighborhood: profile?.neighborhood || null,
      bio: profile?.bio || null,
      emergencyContact: profile?.emergencyContact || null,
      emergencyPhone: profile?.emergencyPhone || null,
      accountQrUrl: profile?.accountQrUrl || null,
    });
  }
}
