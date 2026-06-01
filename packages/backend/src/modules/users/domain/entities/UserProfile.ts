import { v4 as uuidv4 } from 'uuid';

/**
 * Entidad UserProfile - Capa de dominio
 * Perfil extendido del usuario (RF2)
 */
export class UserProfile {
  readonly id: string;
  readonly userId: string;
  readonly career: string | null;
  readonly photoUrl: string | null;
  readonly phone: string | null;
  readonly zone: string | null;
  readonly neighborhood: string | null;
  readonly bio: string | null;
  readonly emergencyContact: string | null;
  readonly emergencyPhone: string | null;
  readonly accountQrUrl: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(
    userId: string,
    career: string | null = null,
    photoUrl: string | null = null,
    phone: string | null = null,
    zone: string | null = null,
    neighborhood: string | null = null,
    bio: string | null = null,
    emergencyContact: string | null = null,
    emergencyPhone: string | null = null,
    accountQrUrl: string | null = null,
    id: string = uuidv4(),
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ) {
    this.id = id;
    this.userId = userId;
    this.career = career;
    this.photoUrl = photoUrl;
    this.phone = phone;
    this.zone = zone;
    this.neighborhood = neighborhood;
    this.bio = bio;
    this.emergencyContact = emergencyContact;
    this.emergencyPhone = emergencyPhone;
    this.accountQrUrl = accountQrUrl;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
