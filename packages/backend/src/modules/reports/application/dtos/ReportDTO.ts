export class CreateReportDTO {
  reportedId: string;
  rideId?: string;
  reason: string;
  description: string;
  evidenceUrl?: string;

  constructor(data: any) {
    this.reportedId = data.reportedId;
    this.rideId = data.rideId;
    this.reason = data.reason;
    this.description = data.description;
    this.evidenceUrl = data.evidenceUrl;
    this.validate();
  }

  private validate(): void {
    if (!this.reportedId) throw new Error('Reported user ID is required');
    if (!this.reason) throw new Error('Reason is required');
    if (!this.description || this.description.length < 10) throw new Error('Description must be at least 10 characters');
  }
}

export class ResolveReportDTO {
  status: 'RESOLVED' | 'DISMISSED';
  adminNotes: string;
  action?: 'WARN' | 'SUSPEND';
  suspensionDays?: number;

  constructor(data: any) {
    this.status = data.status;
    this.adminNotes = data.adminNotes;
    this.action = data.action;
    this.suspensionDays = data.suspensionDays;
    if (!this.status) throw new Error('Status is required');
    if (!this.adminNotes) throw new Error('Admin notes are required');
  }
}
