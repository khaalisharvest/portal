import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private client: any = null;

  constructor() {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_ACCOUNT_SID !== '') {
      try {
        const twilio = require('twilio');
        this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        this.logger.log('WhatsApp service ready');
      } catch {
        this.logger.warn('Twilio not available');
      }
    } else {
      this.logger.warn('Twilio not configured — WhatsApp messages logged only');
    }
  }

  async notifyAdminNewOrder(order: {
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    totalAmount: number;
    paymentMethod: string;
    city: string;
    itemCount: number;
  }): Promise<void> {
    const payment = order.paymentMethod === 'cash_on_delivery' ? 'COD' : 'Bank Transfer';
    const msg =
      `🌿 *New Order — Khaalis Harvest*\n\n` +
      `📋 *${order.orderNumber}*\n` +
      `👤 ${order.customerName}\n` +
      `📞 ${order.customerPhone}\n` +
      `📍 ${order.city}\n` +
      `🛒 ${order.itemCount} item(s)\n` +
      `💰 *PKR ${order.totalAmount.toFixed(0)}*\n` +
      `💳 ${payment}`;

    const admin = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || '+923204749700';
    const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

    if (!this.client) {
      this.logger.debug(`[WHATSAPP] To admin ${admin}:\n${msg}`);
      return;
    }
    try {
      await this.client.messages.create({ body: msg, from, to: `whatsapp:${admin}` });
      this.logger.log(`WhatsApp sent for ${order.orderNumber}`);
    } catch (err) {
      this.logger.error(`WhatsApp failed: ${err.message}`);
    }
  }
}
