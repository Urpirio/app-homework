import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
  }

  async sendVerificationCode(email: string, code: string) {
    try {
      await this.resend.emails.send({
        from: 'App Homework <Soport@urpiriodev.com.do>', // Usar dominio verificado en producción
        to: email,
        subject: 'Verifica tu cuenta - App Homework',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #007AFF; text-align: center;">Bienvenido a App Homework</h2>
            <p>Gracias por registrarte. Para activar tu cuenta, por favor ingresa el siguiente código de verificación en la aplicación:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; margin: 20px 0;">
              ${code}
            </div>
            <p>Este código expirará en 15 minutos.</p>
            <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
              Si no solicitaste esta cuenta, puedes ignorar este correo.
            </p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Error sending verification email:', error);
    }
  }

  async sendPasswordResetCode(email: string, code: string) {
    try {
      await this.resend.emails.send({
        from: 'App Homework <Soport@urpiriodev.com.do>',
        to: email,
        subject: 'Recupera tu contraseña - App Homework',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #007AFF; text-align: center;">Recuperación de Contraseña</h2>
            <p>Has solicitado restablecer tu contraseña. Ingresa el siguiente código de seguridad para continuar:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; margin: 20px 0;">
              ${code}
            </div>
            <p>Este código expirará en 15 minutos.</p>
            <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
              Si no solicitaste este cambio, te recomendamos asegurar tu cuenta.
            </p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Error sending password reset email:', error);
    }
  }
}
