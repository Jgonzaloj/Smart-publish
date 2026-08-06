import nodemailer from 'nodemailer';

export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        // Defaults to Mailtrap or similar local test server if env vars are missing
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
            port: Number(process.env.SMTP_PORT) || 2525,
            auth: {
                user: process.env.SMTP_USER || 'testuser',
                pass: process.env.SMTP_PASS || 'testpass',
            },
        });
    }

    private async sendMail(to: string, subject: string, html: string) {
        try {
            const info = await this.transporter.sendMail({
                from: `"Smart Publish" <${process.env.SMTP_FROM || 'noreply@smartpublish.com'}>`,
                to,
                subject,
                html,
            });
            console.log('Message sent: %s', info.messageId);
        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error('No se pudo enviar el correo.');
        }
    }

    async sendPasswordResetEmail(email: string, token: string) {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #0ea5e9;">Recuperación de Contraseña</h2>
                <p>Hola,</p>
                <p>Hemos recibido una solicitud para restablecer tu contraseña. Si no fuiste tú, puedes ignorar este correo.</p>
                <p>Para restablecer tu contraseña, haz clic en el siguiente botón:</p>
                <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Restablecer Contraseña</a>
                <p>Este enlace expirará en 1 hora.</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 12px; color: #64748b;">Equipo de Smart Publish</p>
            </div>
        `;

        await this.sendMail(email, 'Restablece tu contraseña - Smart Publish', html);
    }

    async sendTeamInviteEmail(email: string, workspaceName: string, role: string, token: string) {
        // We will create a /register endpoint that accepts a token
        const inviteUrl = `${process.env.FRONTEND_URL}/register?invite_token=${token}&email=${encodeURIComponent(email)}`;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #0ea5e9;">¡Te han invitado a colaborar!</h2>
                <p>Hola,</p>
                <p>Has sido invitado a unirte al workspace <strong>${workspaceName}</strong> con el rol de <strong>${role}</strong> en Smart Publish.</p>
                <p>Para aceptar la invitación y crear tu cuenta, haz clic en el siguiente botón:</p>
                <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background-color: #8b5cf6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Aceptar Invitación</a>
                <p>Este enlace expirará en 48 horas.</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 12px; color: #64748b;">Equipo de Smart Publish</p>
            </div>
        `;

        await this.sendMail(email, `Invitación al equipo ${workspaceName} - Smart Publish`, html);
    }
}
