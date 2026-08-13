import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { env } from '../../config/env';

interface WaTextParam { type: 'text'; text: string }
interface WaComponent {
  type: 'body' | 'button';
  sub_type?: string;
  index?: string;
  parameters: WaTextParam[];
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly apiBase = 'https://graph.facebook.com/v20.0';

  private assertConfigured(): void {
    if (!env.WHATSAPP_PHONE_NUMBER_ID || !env.WHATSAPP_ACCESS_TOKEN) {
      throw new ServiceUnavailableException('WhatsApp service is not configured');
    }
  }

  private formatPhone(phone: string): string {
    return phone.replace(/^\+/, '');
  }

  private maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7) return phone;
    return `+${digits.slice(0, 4)}***${digits.slice(-4)}`;
  }

  async sendTemplate(
    phone: string,
    templateName: string,
    languageCode: string,
    components: WaComponent[],
  ): Promise<void> {
    this.assertConfigured();
    const recipient = this.formatPhone(phone);

    const res = await fetch(
      `${this.apiBase}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: recipient,
          type: 'template',
          template: { name: templateName, language: { code: languageCode }, components },
        }),
      },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      this.logger.error(
        `WA send failed → ${this.maskPhone(phone)} [${templateName}]: ${JSON.stringify(err)}`,
      );
      throw new ServiceUnavailableException('Failed to send WhatsApp message');
    }

    this.logger.log(`WA sent → ${this.maskPhone(phone)} [${templateName}]`);
  }

  async sendOtp(phone: string, otp: string): Promise<void> {
    return this.sendTemplate(phone, env.WHATSAPP_OTP_TEMPLATE_NAME, 'en', [
      {
        type: 'body',
        parameters: [{ type: 'text', text: otp }],
      },
    ]);
  }

  async sendOrderConfirmation(
    phone: string,
    orderNumber: string,
    total: number,
    paymentMethod: string,
  ): Promise<void> {
    const totalFormatted = `PKR ${Number(total).toLocaleString('en-PK')}`;
    const paymentLabel =
      paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' :
      paymentMethod === 'bank_transfer'    ? 'Bank Transfer'    : paymentMethod;

    return this.sendTemplate(phone, env.WHATSAPP_ORDER_TEMPLATE_NAME, 'en', [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: orderNumber },
          { type: 'text', text: totalFormatted },
          { type: 'text', text: paymentLabel },
        ],
      },
    ]);
  }

  async sendOrderStatusUpdate(
    phone: string,
    orderNumber: string,
    status: string,
  ): Promise<void> {
    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
    return this.sendTemplate(phone, env.WHATSAPP_STATUS_TEMPLATE_NAME, 'en', [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: orderNumber },
          { type: 'text', text: statusLabel },
        ],
      },
    ]);
  }
}
