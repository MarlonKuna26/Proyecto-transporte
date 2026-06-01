import nodemailer from 'nodemailer';

export class EmailService {
  private static isDevMode(): boolean {
    return process.env.EMAIL_DEV_MODE === 'true';
  }

  private static createTransporter() {
    const emailUser = process.env.EMAIL_USER?.trim();
    const emailPass = process.env.EMAIL_PASS?.replace(/\s+/g, '');

    if (!emailUser || !emailPass) {
      if (this.isDevMode()) {
        return null;
      }
      throw new Error(
        'Falta configurar EMAIL_USER y EMAIL_PASS en packages/backend/.env',
      );
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;

    if (smtpHost) {
      return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort ? Number(smtpPort) : 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });
    }

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  }

  private static async sendMail(options: nodemailer.SendMailOptions): Promise<void> {
    const transporter = this.createTransporter();

    if (!transporter) {
      console.log('[EMAIL DEV MODE]', options);
      return;
    }

    try {
      await transporter.sendMail(options);
    } catch (error: any) {
      throw new Error(
        `No se pudo enviar el correo: ${error?.message || 'SMTP error'}`,
      );
    }
  }

  static async sendVerificationEmail(to: string, code: string) {
    await this.sendMail({
      from: `"U-Ride" <${process.env.EMAIL_USER || 'no-reply@u-ride.local'}>`,
      to,
      subject: 'Código de verificación',
      html: `
        <h2>Verificación de cuenta</h2>
        <p>Tu código es:</p>
        <h1>${code}</h1>
        <p>Expira en 30 minutos</p>
      `,
    });
  }

  static async sendPasswordResetEmail(to: string, resetUrl: string) {
    await this.sendMail({
      from: `"U-Ride" <${process.env.EMAIL_USER || 'no-reply@u-ride.local'}>`,
      to,
      subject: 'Recuperación de contraseña',
      html: `
        <h2>Recupera tu contraseña</h2>
        <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
        <p><a href="${resetUrl}">Restablecer contraseña</a></p>
        <p>Este enlace expira en 30 minutos.</p>
      `,
    });
  }

  static async sendPasswordResetCode(to: string, code: string) {
    await this.sendMail({
      from: `"U-Ride" <${process.env.EMAIL_USER || 'no-reply@u-ride.local'}>`,
      to,
      subject: 'Código para cambiar tu contraseña',
      html: `
        <h2>Recuperación de contraseña</h2>
        <p>Tu código de verificación es:</p>
        <h1 style="font-size: 32px; letter-spacing: 4px; color: #000;">${code}</h1>
        <p>Expira en 15 minutes</p>
        <p style="color: #999; font-size: 12px;">Si no solicitaste cambiar tu contraseña, ignora este correo.</p>
      `,
    });
  }

  static async sendRideCancellationEmail(to: string, details: { origin: string; destination: string; date: string; time: string }) {
    await this.sendMail({
      from: `"U-Ride" <${process.env.EMAIL_USER || 'no-reply@u-ride.local'}>`,
      to,
      subject: 'Viaje Cancelado 🚗',
      html: `
        <h2>El conductor ha cancelado el viaje</h2>
        <p>Lamentamos informarte que el viaje programado ha sido cancelado por el conductor:</p>
        <ul>
          <li><strong>Origen:</strong> ${details.origin}</li>
          <li><strong>Destino:</strong> ${details.destination}</li>
          <li><strong>Fecha:</strong> ${details.date}</li>
          <li><strong>Hora:</strong> ${details.time}</li>
        </ul>
        <p>Puedes calificar al conductor para dejar un comentario sobre esta cancelación ingresando a la sección "Mis solicitudes".</p>
      `,
    });
  }

  static async sendRideRequestAcceptedEmail(to: string, details: { origin: string; destination: string; date: string; time: string }) {
    await this.sendMail({
      from: `"U-Ride" <${process.env.EMAIL_USER || 'no-reply@u-ride.local'}>`,
      to,
      subject: '¡Solicitud de viaje Aceptada! 🎉🚗',
      html: `
        <h2>Tu solicitud de viaje ha sido aceptada</h2>
        <p>¡Buenas noticias! El conductor ha aceptado tu solicitud para unirte al viaje:</p>
        <ul>
          <li><strong>Origen:</strong> ${details.origin}</li>
          <li><strong>Destino:</strong> ${details.destination}</li>
          <li><strong>Fecha:</strong> ${details.date}</li>
          <li><strong>Hora:</strong> ${details.time}</li>
        </ul>
        <p>Por favor, revisa los detalles del viaje en la sección "Mis solicitudes". ¡Buen viaje!</p>
      `,
    });
  }

  static async sendRideRequestRejectedEmail(to: string, details: { origin: string; destination: string; date: string; time: string; rejectReason?: string | null }) {
    await this.sendMail({
      from: `"U-Ride" <${process.env.EMAIL_USER || 'no-reply@u-ride.local'}>`,
      to,
      subject: 'Solicitud de viaje Rechazada ❌🚗',
      html: `
        <h2>Tu solicitud de viaje ha sido rechazada</h2>
        <p>Lamentamos informarte que el conductor ha rechazado tu solicitud para unirte al viaje:</p>
        <ul>
          <li><strong>Origen:</strong> ${details.origin}</li>
          <li><strong>Destino:</strong> ${details.destination}</li>
          <li><strong>Fecha:</strong> ${details.date}</li>
          <li><strong>Hora:</strong> ${details.time}</li>
        </ul>
        ${details.rejectReason ? `<p><strong>Motivo del rechazo:</strong> ${details.rejectReason}</p>` : ''}
        <p>Puedes buscar otros viajes disponibles en la plataforma.</p>
      `,
    });
  }

  static async sendPassengerCancelledRequestEmail(to: string, details: { origin: string; destination: string; date: string; time: string, passengerName?: string }) {
    await this.sendMail({
      from: `"U-Ride" <${process.env.EMAIL_USER || 'no-reply@u-ride.local'}>`,
      to,
      subject: 'Un pasajero ha cancelado su reserva ⚠️',
      html: `
        <h2>Cancelación de reserva</h2>
        <p>El pasajero <strong>${details.passengerName || 'que aceptaste'}</strong> ha cancelado su reserva para el siguiente viaje:</p>
        <ul>
          <li><strong>Origen:</strong> ${details.origin}</li>
          <li><strong>Destino:</strong> ${details.destination}</li>
          <li><strong>Fecha:</strong> ${details.date}</li>
          <li><strong>Hora:</strong> ${details.time}</li>
        </ul>
        <p>Los asientos que había solicitado han sido restaurados automáticamente a tu viaje.</p>
      `,
    });
  }

  static async sendReportResolvedEmail(to: string, details: { reportReason: string, adminNotes: string }) {
    await this.sendMail({
      from: `"U-Ride" <${process.env.EMAIL_USER || 'no-reply@u-ride.local'}>`,
      to,
      subject: 'Tu reporte ha sido resuelto 🛡️',
      html: `
        <h2>Resolución de Reporte</h2>
        <p>El equipo de administración ha revisado y resuelto el reporte que enviaste por el motivo: <strong>${details.reportReason}</strong>.</p>
        <p><strong>Notas de administración:</strong></p>
        <p style="background: #f5f5f5; padding: 12px; border-left: 4px solid #000;">${details.adminNotes}</p>
        <p>Gracias por ayudarnos a mantener una comunidad segura.</p>
      `,
    });
  }
}