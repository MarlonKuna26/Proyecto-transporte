import nodemailer from 'nodemailer';

export class EmailService {
  private static createTransporter() {
    const emailUser = process.env.EMAIL_USER?.trim();
    const emailPass = process.env.EMAIL_PASS?.replace(/\s+/g, '');

    if (!emailUser || !emailPass) {
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

  static async sendVerificationEmail(to: string, code: string) {
    const transporter = this.createTransporter();

    try {
      await transporter.sendMail({
        from: `"U-Ride" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Código de verificación',
        html: `
          <h2>Verificación de cuenta</h2>
          <p>Tu código es:</p>
          <h1>${code}</h1>
          <p>Expira en 30 minutos</p>
        `,
      });
    } catch (error: any) {
      throw new Error(
        `No se pudo enviar el correo de verificación: ${error?.message || 'SMTP error'}`,
      );
    }
  }
}