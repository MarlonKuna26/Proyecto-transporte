/**
 * DTOs para perfil de usuario
 */

export class UpdateProfileDTO {
  career?: string;
  photoUrl?: string;
  phone?: string;
  zone?: string;
  neighborhood?: string;
  bio?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  accountQrUrl?: string;

  constructor(data: Partial<UpdateProfileDTO>) {
    Object.assign(this, data);
  }
}

export class ProfileResponseDTO {
  userId: string;
  email: string;
  name: string;
  role: string;
  reputation: number;
  totalRatings: number;
  isVerified: boolean;
  career: string | null;
  photoUrl: string | null;
  phone: string | null;
  zone: string | null;
  neighborhood: string | null;
  bio: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  accountQrUrl: string | null;

  constructor(data: any) {
    this.userId = data.userId;
    this.email = data.email;
    this.name = data.name;
    this.role = data.role;
    this.reputation = data.reputation;
    this.totalRatings = data.totalRatings || 0;
    this.isVerified = data.isVerified;
    this.career = data.career;
    this.photoUrl = data.photoUrl;
    this.phone = data.phone;
    this.zone = data.zone;
    this.neighborhood = data.neighborhood;
    this.bio = data.bio;
    this.emergencyContact = data.emergencyContact;
    this.emergencyPhone = data.emergencyPhone;
    this.accountQrUrl = data.accountQrUrl;
  }
}
