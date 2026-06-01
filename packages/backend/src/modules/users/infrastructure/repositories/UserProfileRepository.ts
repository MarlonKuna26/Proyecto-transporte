import { DatabaseConnection } from '@config/database';
import { UserProfile } from '../../domain/entities/UserProfile';
import { IUserProfileRepository } from '../../domain/interfaces/IUserProfileRepository';

interface ProfileRow {
  id: string;
  usuario_id: string;
  carrera: string | null;
  url_foto: string | null;
  telefono: string | null;
  zona: string | null;
  barrio: string | null;
  biografia: string | null;
  contacto_emergencia: string | null;
  telefono_emergencia: string | null;
  url_qr_cuenta: string | null;
  creado_en: Date;
  actualizado_en: Date;
}

export class UserProfileRepository implements IUserProfileRepository {
  private readonly pool = DatabaseConnection.getInstance();

  async findByUserId(userId: string): Promise<UserProfile | null> {
    const result = await this.pool.query(
      'SELECT * FROM perfiles_usuario WHERE usuario_id = $1',
      [userId],
    );
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async create(profile: UserProfile): Promise<UserProfile> {
    const query = `
      INSERT INTO perfiles_usuario (id, usuario_id, carrera, url_foto, telefono, zona, barrio, biografia, contacto_emergencia, telefono_emergencia, url_qr_cuenta)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const values = [
      profile.id, profile.userId, profile.career, profile.photoUrl,
      profile.phone, profile.zone, profile.neighborhood, profile.bio,
      profile.emergencyContact, profile.emergencyPhone, profile.accountQrUrl
    ];
    const result = await this.pool.query(query, values);
    return this.mapRow(result.rows[0]);
  }

  async update(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const fieldMap: Record<string, string> = {
      career: 'carrera',
      photoUrl: 'url_foto',
      phone: 'telefono',
      zone: 'zona',
      neighborhood: 'barrio',
      bio: 'biografia',
      emergencyContact: 'contacto_emergencia',
      emergencyPhone: 'telefono_emergencia',
      accountQrUrl: 'url_qr_cuenta',
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

    updates.push(`actualizado_en = $${idx++}`);
    values.push(new Date());
    values.push(userId);

    const query = `UPDATE perfiles_usuario SET ${updates.join(', ')} WHERE usuario_id = $${idx} RETURNING *`;
    const result = await this.pool.query(query, values);
    return this.mapRow(result.rows[0]);
  }

  private mapRow(row: ProfileRow): UserProfile {
    return new UserProfile(
      row.usuario_id,
      row.carrera,
      row.url_foto,
      row.telefono,
      row.zona,
      row.barrio,
      row.biografia,
      row.contacto_emergencia,
      row.telefono_emergencia,
      row.url_qr_cuenta,
      row.id,
      new Date(row.creado_en),
      new Date(row.actualizado_en),
    );
  }
}
