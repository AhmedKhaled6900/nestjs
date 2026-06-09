import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private fromEmail: string | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initResend();
  }

  async sendVerificationEmail(
    email: string,
    name: string,
    code: string,
  ): Promise<boolean> {
    const subject = 'Verify your Aqar account';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Welcome to Aqar, ${name}!</h2>
        <p>Your email verification code is:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2563eb;">${code}</p>
        <p>This code expires in <strong>5 minutes</strong>.</p>
        <p>If you did not create an account, please ignore this email.</p>
      </div>
    `;
    const text = `Hello ${name}, your Aqar verification code is: ${code}. It expires in 5 minutes.`;

    return this.send(email, subject, html, text, code);
  }

  private async send(
    to: string,
    subject: string,
    html: string,
    text: string,
    codeForDevLog?: string,
  ): Promise<boolean> {
    if (!this.resend || !this.fromEmail) {
      this.logger.warn(
        `Resend not configured — email NOT sent to ${to}. ` +
          `Set RESEND_API_KEY and RESEND_FROM in .env. ` +
          (codeForDevLog ? `Dev code: ${codeForDevLog}` : ''),
      );
      return false;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject,
        html,
        text,
      });

      if (error) {
        throw error;
      }

      this.logger.log(`Email sent via Resend to ${to}: ${subject}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      if (codeForDevLog) {
        this.logger.warn(
          `Resend failed — use this verification code for ${to}: ${codeForDevLog}`,
        );
      }
      return false;
    }
  }

  private initResend(): void {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    const from = this.configService.get<string>('RESEND_FROM');

    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY missing — emails will only be logged to console',
      );
      return;
    }

    this.resend = new Resend(apiKey);
    this.fromEmail = from ?? 'Aqar <onboarding@resend.dev>';

    this.logger.log(`Resend configured (from: ${this.fromEmail})`);
  }
}
