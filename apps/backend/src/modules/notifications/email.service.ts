import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      this.logger.log('Email service ready');
    } else {
      this.logger.warn('SMTP not configured — emails logged to console only');
    }
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    if (!to) return;
    if (!this.transporter) {
      this.logger.debug(`[EMAIL] To: ${to} | Subject: ${subject}`);
      return;
    }
    try {
      await this.transporter.sendMail({
        from: `"Khaalis Harvest" <${process.env.SMTP_FROM || 'noreply@khaalisharvest.pk'}>`,
        to, subject, html,
      });
      this.logger.log(`Email sent → ${to}`);
    } catch (err) {
      this.logger.error(`Email failed → ${to}: ${err.message}`);
    }
  }
}
