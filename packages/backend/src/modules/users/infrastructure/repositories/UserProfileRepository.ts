import { DatabaseConnection } from '@config/database';
import { UserProfile } from '../../domain/entities/UserProfile';
import { IUserProfileRepository } from '../../domain/interfaces/IUserProfileRepository';

interface ProfileRow {
  id: string;
  user_id: string;
  career: string | null;
  photo_url: string | null;
  phone: string | null;
  zone: string | null;
  neighborhood: string | null;
  bio: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  created_at: Date;
  updated_at: Date;
}

export class UserProfileRepository implements IUserProfileRepository {
  private readonly pool = DatabaseConnection.getInstance();

  async findByUserId(userId: string): Promise<UserProfile | null> {
    const result = await this.pool.query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [userId],
    );
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async create(profile: UserProfile): Promise<UserProfile> {
    const query = `
      INSERT INTO user_profiles (id, user_id, career, photo_url, phone, zone, neighborhood, bio, emergency_contact, emergency_phone)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const values = [
      profile.id, profile.userId, profile.career, profile.photoUrl,
      profile.phone, profile.zone, profile.neighborhood, profile.bio,
      profile.emergencyContact, profile.emergencyPhone,
    ];
    const result = await this.pool.query(query, values);
    return this.mapRow(result.rows[0]);
  }

  async update(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const fieldMap: Record<string, string> = {
      career: 'career',
      photoUrl: 'photo_url',
      phone: 'phone',
      zone: 'zone',
      neighborhood: 'neighborhood',
      bio: 'bio',
      emergencyContact: 'emergency_contact',
      emergencyPhone: 'emergency_phone',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if ((data as any)[key] !== undefined) {
        updates.push(`${col} = $${idx++}`);
        values.push((data as any)[key]);
      }
    }

    if (updates.length === 0) {
      const existing = await this.findByUserId(userId);
      return existing!;
    }

    updates.push(`updated_at = $${idx++}`);
    values.push(new Date());
    values.push(userId);

    const query = `UPDATE user_profiles SET ${updates.join(', ')} WHERE user_id = $${idx} RETURNING *`;
    const result = await this.pool.query(query, values);
    return this.mapRow(result.rows[0]);
  }

  private mapRow(row: ProfileRow): UserProfile {
    return new UserProfile(
      row.user_id,
      row.career,
      row.photo_url,
      row.phone,
      row.zone,
      row.neighborhood,
      row.bio,
      row.emergency_contact,
      row.emergency_phone,
      row.id,
      new Date(row.created_at),
      new Date(row.updated_at),
    );
  }
}
