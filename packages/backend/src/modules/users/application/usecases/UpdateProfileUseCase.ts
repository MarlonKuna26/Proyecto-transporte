import { IUseCase } from '@shared/types';
import { IUserProfileRepository } from '../../domain/interfaces/IUserProfileRepository';
import { UpdateProfileDTO, ProfileResponseDTO } from '../dtos/UserProfileDTO';
import { IUserRepository } from '@modules/auth/domain/interfaces/IUserRepository';
import { NotFoundError } from '@shared/errors/AppError';

interface UpdateProfileInput {
  userId: string;
  data: UpdateProfileDTO;
}

export class UpdateProfileUseCase implements IUseCase<UpdateProfileInput, ProfileResponseDTO> {
  constructor(
    private userProfileRepository: IUserProfileRepository,
    private userRepository: IUserRepository,
  ) {}

  async execute(input: UpdateProfileInput): Promise<ProfileResponseDTO> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Actualizar nombre en users si se proporciona
    if ((input.data as any).name) {
      await this.userRepository.update(input.userId, { name: (input.data as any).name });
    }

    // Crear o actualizar perfil
    let profile = await this.userProfileRepository.findByUserId(input.userId);
    if (!profile) {
      const { UserProfile } = await import('../../domain/entities/UserProfile');
      profile = await this.userProfileRepository.create(
        new UserProfile(input.userId),
      );
    }

    profile = await this.userProfileRepository.update(input.userId, input.data as any);

    const updatedUser = await this.userRepository.findById(input.userId);

    return new ProfileResponseDTO({
      userId: updatedUser!.id,
      email: updatedUser!.email,
      name: updatedUser!.name,
      role: updatedUser!.role,
      reputation: updatedUser!.reputation,
      totalRatings: (updatedUser as any)?.totalRatings || 0,
      isVerified: updatedUser!.isVerified,
      career: profile?.career || null,
      photoUrl: profile?.photoUrl || null,
      phone: profile?.phone || null,
      zone: profile?.zone || null,
      neighborhood: profile?.neighborhood || null,
      bio: profile?.bio || null,
      emergencyContact: profile?.emergencyContact || null,
      emergencyPhone: profile?.emergencyPhone || null,
    });
  }
}
