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

  private getHtmlTemplate(title: string, subtitle: string, code: string, footerNote: string) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td align="center" style="padding: 40px 40px 20px 40px; background: linear-gradient(135deg, #007AFF 0%, #00C6FF 100%);">
                    <div style="width: 60px; height: 60px; background-color: rgba(255, 255, 255, 0.2); border-radius: 18px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                      <span style="font-size: 32px; color: white;">🚀</span>
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">App Homework</h1>
                  </td>
                </tr>
                
                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 22px; font-weight: 700; text-align: center;">${title}</h2>
                    <p style="margin: 0 0 32px 0; color: #64748b; font-size: 16px; line-height: 24px; text-align: center;">${subtitle}</p>
                    
                    <div style="background-color: #f1f5f9; border-radius: 20px; padding: 32px; text-align: center; margin-bottom: 32px;">
                      <span style="display: block; font-size: 14px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Tu código de seguridad</span>
                      <div style="font-size: 42px; font-weight: 800; color: #007AFF; letter-spacing: 8px; font-family: monospace;">${code}</div>
                    </div>
                    
                    <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 16px; border-radius: 8px;">
                      <p style="margin: 0; color: #9a3412; font-size: 14px; font-weight: 500;">
                        <strong>Importante:</strong> Este código expirará en 15 minutos por tu seguridad. No compartas este código con nadie.
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 32px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="margin: 0 0 12px 0; color: #64748b; font-size: 14px;">${footerNote}</p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">&copy; 2026 App Homework. Todos los derechos reservados.</p>
                  </td>
                </tr>
              </table>
              
              <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin-top: 24px; text-align: center;">
                <tr>
                  <td>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                      Recibiste este correo porque estás registrado en App Homework.<br>
                      Si no fuiste tú, por favor <a href="#" style="color: #007AFF; text-decoration: none;">contacta a soporte</a>.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  async sendVerificationCode(email: string, code: string) {
    try {
      const html = this.getHtmlTemplate(
        '¡Bienvenido a bordo!',
        'Estamos emocionados de tenerte aquí. Para empezar a gestionar tus tareas de forma inteligente, verifica tu cuenta.',
        code,
        'Gracias por elegir App Homework para potenciar tu productividad.'
      );

      await this.resend.emails.send({
        from: 'App Homework <Soport@urpiriodev.com.do>',
        to: email,
        subject: '🔒 Verifica tu cuenta - App Homework',
        html,
      });
    } catch (error) {
      console.error('Error sending verification email:', error);
    }
  }

  async sendPasswordResetCode(email: string, code: string) {
    try {
      const html = this.getHtmlTemplate(
        'Recupera tu acceso',
        'Hemos recibido una solicitud para restablecer tu contraseña. Usa el siguiente código para completar el proceso.',
        code,
        'Si no solicitaste este cambio, te recomendamos cambiar tu contraseña de inmediato.'
      );

      await this.resend.emails.send({
        from: 'App Homework <Soport@urpiriodev.com.do>',
        to: email,
        subject: '🔑 Recupera tu contraseña - App Homework',
        html,
      });
    } catch (error) {
      console.error('Error sending password reset email:', error);
    }
  }
}
