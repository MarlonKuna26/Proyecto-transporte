"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const EmailService_1 = require("../../src/shared/services/EmailService");
jest.mock('nodemailer');
const sendMailMock = jest.fn();
beforeAll(() => {
    nodemailer_1.default.createTransport.mockReturnValue({
        sendMail: sendMailMock,
    });
});
beforeEach(() => {
    jest.clearAllMocks();
    process.env.EMAIL_USER = 'test@gmail.com';
    process.env.EMAIL_PASS = 'password123';
    process.env.EMAIL_DEV_MODE = 'false';
});
describe('EmailService Integration Tests', () => {
    it('debe enviar correo de verificación correctamente', async () => {
        await EmailService_1.EmailService.sendVerificationEmail('user@test.com', '123456');
        expect(sendMailMock).toHaveBeenCalledTimes(1);
        const mail = sendMailMock.mock.calls[0][0];
        expect(mail.to).toBe('user@test.com');
        expect(mail.subject).toBe('Código de verificación');
        expect(mail.html).toContain('123456');
    });
    it('debe enviar correo de recuperación de contraseña', async () => {
        await EmailService_1.EmailService.sendPasswordResetEmail('user@test.com', 'http://reset-link.com');
        const mail = sendMailMock.mock.calls[0][0];
        expect(mail.subject).toBe('Recuperación de contraseña');
        expect(mail.html).toContain('reset-link.com');
    });
    it('debe enviar correo de cancelación de viaje', async () => {
        await EmailService_1.EmailService.sendRideCancellationEmail('user@test.com', {
            origin: 'Ambato',
            destination: 'Quito',
            date: '2026-06-01',
            time: '10:00',
        });
        const mail = sendMailMock.mock.calls[0][0];
        expect(mail.subject).toBe('Viaje Cancelado 🚗');
        expect(mail.html).toContain('Ambato');
        expect(mail.html).toContain('Quito');
    });
    it('debe funcionar en modo desarrollo sin SMTP', async () => {
        process.env.EMAIL_USER = '';
        process.env.EMAIL_PASS = '';
        process.env.EMAIL_DEV_MODE = 'true';
        await EmailService_1.EmailService.sendVerificationEmail('user@test.com', '999999');
        expect(sendMailMock).not.toHaveBeenCalled();
    });
    it('debe lanzar error si SMTP falla', async () => {
        sendMailMock.mockRejectedValueOnce(new Error('SMTP caído'));
        await expect(EmailService_1.EmailService.sendVerificationEmail('user@test.com', '123456')).rejects.toThrow('No se pudo enviar el correo');
    });
});
//# sourceMappingURL=emailService.test.js.map