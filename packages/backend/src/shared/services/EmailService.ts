import nodemailer from 'nodemailer';

export class EmailService {
  private static transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  static async sendVerificationEmail(to: string, code: string) {
    await this.transporter.sendMail({
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
  }
}