import { DatabaseConnection } from '@config/database';
import { Report, ReportStatus } from '../../domain/entities/Report';
import { IReportRepository } from '../../domain/interfaces/IReportRepository';
import { NotFoundError } from '@shared/errors/AppError';

interface ReportRow {
  id: string; reportante_id: string; reportado_id: string; viaje_id: string | null;
  motivo: string; descripcion: string; url_evidencia: string | null;
  estado: ReportStatus; notas_admin: string | null;
  resuelto_por: string | null; resuelto_en: Date | null;
  creado_en: Date; actualizado_en: Date;
}

export class ReportRepository implements IReportRepository {
  private readonly pool = DatabaseConnection.getInstance();

  async create(report: Report): Promise<Report> {
    const query = `
      INSERT INTO reportes (id, reportante_id, reportado_id, viaje_id, motivo, descripcion, url_evidencia, estado)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `;
    const result = await this.pool.query(query, [
      report.id, report.reporterId, report.reportedId, report.rideId,
      report.reason, report.description, report.evidenceUrl, report.status,
    ]);
    return this.mapRow(result.rows[0]);
  }

  async findById(id: string): Promise<Report | null> {
    const result = await this.pool.query('SELECT * FROM reportes WHERE id = $1', [id]);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async findAll(status?: ReportStatus): Promise<Report[]> {
    let query = 'SELECT * FROM reportes';
    const values: any[] = [];
    if (status) { query += ' WHERE estado = $1'; values.push(status); }
    query += ' ORDER BY creado_en DESC';
    const result = await this.pool.query(query, values);
    return result.rows.map((r: ReportRow) => this.mapRow(r));
  }

  async findByReporterId(reporterId: string): Promise<Report[]> {
    const result = await this.pool.query('SELECT * FROM reportes WHERE reportante_id = $1 ORDER BY creado_en DESC', [reporterId]);
    return result.rows.map((r: ReportRow) => this.mapRow(r));
  }

  async findByReportedId(reportedId: string): Promise<Report[]> {
    const result = await this.pool.query('SELECT * FROM reportes WHERE reportado_id = $1 ORDER BY creado_en DESC', [reportedId]);
    return result.rows.map((r: ReportRow) => this.mapRow(r));
  }

  async update(id: string, data: Partial<Report>): Promise<Report> {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const fieldMap: Record<string, string> = {
      status: 'estado', adminNotes: 'notas_admin', resolvedBy: 'resuelto_por', resolvedAt: 'resuelto_en',
    };
    for (const [key, col] of Object.entries(fieldMap)) {
      if ((data as any)[key] !== undefined) { updates.push(`${col} = $${idx++}`); values.push((data as any)[key]); }
    }
    updates.push(`actualizado_en = $${idx++}`); values.push(new Date());
    values.push(id);

    const query = `UPDATE reportes SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await this.pool.query(query, values);
    if (!result.rows[0]) throw new NotFoundError('Reporte no encontrado');
    return this.mapRow(result.rows[0]);
  }

  private mapRow(row: ReportRow): Report {
    return new Report(
      row.reportante_id, row.reportado_id, row.motivo, row.descripcion,
      row.viaje_id, row.url_evidencia, row.estado, row.notas_admin,
      row.resuelto_por, row.resuelto_en ? new Date(row.resuelto_en) : null,
      row.id, new Date(row.creado_en), new Date(row.actualizado_en),
    );
  }
}
