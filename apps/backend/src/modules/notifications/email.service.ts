import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as Sentry from '@sentry/nestjs';
import { env } from '../../config/env';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: false,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      });
      this.logger.log('Email service ready with SMTP');
    } else {
      this.logger.warn('SMTP credentials not configured — emails will be logged to console');
    }
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    if (!to) return;
    if (!this.transporter) {
      this.logger.log(`[EMAIL DEV] To: ${to.replace(/(.{2}).*@/, '$1***@')} | Subject: ${subject}`);
      return;
    }
    try {
      await this.transporter.sendMail({ from: `"Khaalis Harvest" <${env.SMTP_FROM}>`, to, subject, html });
      this.logger.log(`Email sent → ${to}`);
    } catch (err) {
      this.logger.error(`Email failed → ${to.replace(/(.{2}).*@/, '$1***@')}: ${err.message}`);
      Sentry.captureException(err, { extra: { recipient: to.replace(/(.{2}).*@/, '$1***@'), subject } });
    }
  }

  /** Like send() but throws ServiceUnavailableException on SMTP failure — use for security-critical flows like OTP. */
  async sendCritical(to: string, subject: string, html: string): Promise<void> {
    if (!to) return;
    if (!this.transporter) {
      this.logger.log(`[EMAIL DEV] To: ${to.replace(/(.{2}).*@/, '$1***@')} | Subject: ${subject}`);
      return;
    }
    try {
      await this.transporter.sendMail({ from: `"Khaalis Harvest" <${env.SMTP_FROM}>`, to, subject, html });
      this.logger.log(`Email sent → ${to}`);
    } catch (err) {
      this.logger.error(`Critical email failed → ${to.replace(/(.{2}).*@/, '$1***@')}: ${err.message}`);
      Sentry.captureException(err, { extra: { recipient: to.replace(/(.{2}).*@/, '$1***@'), subject } });
      throw new ServiceUnavailableException('Failed to send reset code. Please try again later.');
    }
  }
}
