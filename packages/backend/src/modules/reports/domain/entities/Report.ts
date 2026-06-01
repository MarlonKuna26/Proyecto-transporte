import { v4 as uuidv4 } from 'uuid';

export type ReportStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';

export class Report {
  readonly id: string;
  readonly reporterId: string;
  readonly reportedId: string;
  readonly rideId: string | null;
  readonly reason: string;
  readonly description: string;
  readonly evidenceUrl: string | null;
  readonly status: ReportStatus;
  readonly adminNotes: string | null;
  readonly resolvedBy: string | null;
  readonly resolvedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(
    reporterId: string,
    reportedId: string,
    reason: string,
    description: string,
    rideId: string | null = null,
    evidenceUrl: string | null = null,
    status: ReportStatus = 'PENDING',
    adminNotes: string | null = null,
    resolvedBy: string | null = null,
    resolvedAt: Date | null = null,
    id: string = uuidv4(),
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ) {
    this.id = id;
    this.reporterId = reporterId;
    this.reportedId = reportedId;
    this.rideId = rideId;
    this.reason = reason;
    this.description = description;
    this.evidenceUrl = evidenceUrl;
    this.status = status;
    this.adminNotes = adminNotes;
    this.resolvedBy = resolvedBy;
    this.resolvedAt = resolvedAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
