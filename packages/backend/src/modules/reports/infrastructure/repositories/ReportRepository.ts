import { DatabaseConnection } from '@config/database';
import { Report, ReportStatus } from '../../domain/entities/Report';
import { IReportRepository } from '../../domain/interfaces/IReportRepository';
import { NotFoundError } from '@shared/errors/AppError';

interface ReportRow {
  id: string; reporter_id: string; reported_id: string; ride_id: string | null;
  reason: string; description: string; evidence_url: string | null;
  status: ReportStatus; admin_notes: string | null;
  resolved_by: string | null; resolved_at: Date | null;
  created_at: Date; updated_at: Date;
}

export class ReportRepository implements IReportRepository {
  private readonly pool = DatabaseConnection.getInstance();

  async create(report: Report): Promise<Report> {
    const query = `
      INSERT INTO reports (id, reporter_id, reported_id, ride_id, reason, description, evidence_url, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `;
    const result = await this.pool.query(query, [
      report.id, report.reporterId, report.reportedId, report.rideId,
      report.reason, report.description, report.evidenceUrl, report.status,
    ]);
    return this.mapRow(result.rows[0]);
  }

  async findById(id: string): Promise<Report | null> {
    const result = await this.pool.query('SELECT * FROM reports WHERE id = $1', [id]);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async findAll(status?: ReportStatus): Promise<Report[]> {
    let query = 'SELECT * FROM reports';
    const values: any[] = [];
    if (status) { query += ' WHERE status = $1'; values.push(status); }
    query += ' ORDER BY created_at DESC';
    const result = await this.pool.query(query, values);
    return result.rows.map((r: ReportRow) => this.mapRow(r));
  }

  async findByReporterId(reporterId: string): Promise<Report[]> {
    const result = await this.pool.query('SELECT * FROM reports WHERE reporter_id = $1 ORDER BY created_at DESC', [reporterId]);
    return result.rows.map((r: ReportRow) => this.mapRow(r));
  }

  async findByReportedId(reportedId: string): Promise<Report[]> {
    const result = await this.pool.query('SELECT * FROM reports WHERE reported_id = $1 ORDER BY created_at DESC', [reportedId]);
    return result.rows.map((r: ReportRow) => this.mapRow(r));
  }

  async update(id: string, data: Partial<Report>): Promise<Report> {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const fieldMap: Record<string, string> = {
      status: 'status', adminNotes: 'admin_notes', resolvedBy: 'resolved_by', resolvedAt: 'resolved_at',
    };
    for (const [key, col] of Object.entries(fieldMap)) {
      if ((data as any)[key] !== undefined) { updates.push(`${col} = $${idx++}`); values.push((data as any)[key]); }
    }
    updates.push(`updated_at = $${idx++}`); values.push(new Date());
    values.push(id);

    const query = `UPDATE reports SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await this.pool.query(query, values);
    if (!result.rows[0]) throw new NotFoundError('Report not found');
    return this.mapRow(result.rows[0]);
  }

  private mapRow(row: ReportRow): Report {
    return new Report(
      row.reporter_id, row.reported_id, row.reason, row.description,
      row.ride_id, row.evidence_url, row.status, row.admin_notes,
      row.resolved_by, row.resolved_at ? new Date(row.resolved_at) : null,
      row.id, new Date(row.created_at), new Date(row.updated_at),
    );
  }
}
