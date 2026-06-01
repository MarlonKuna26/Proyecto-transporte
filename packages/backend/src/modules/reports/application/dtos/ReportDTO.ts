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
    if (!this.reportedId) throw new Error('El ID del usuario reportado es obligatorio');
    if (!this.reason) throw new Error('La razón es obligatoria');
    if (!this.description || this.description.length < 10) throw new Error('La descripción debe tener al menos 10 caracteres');
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
    if (!this.status) throw new Error('El estado es obligatorio');
    if (!this.adminNotes) throw new Error('Las notas administrativas son obligatorias');
  }
}
