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
        <p>Expira en 15 minutos</p>
        <p style="color: #999; font-size: 12px;">Si no solicitaste cambiar tu contraseña, ignora este correo.</p>
      `,
    });
  }
}