import { env } from '../../../config/env';

const STATUS_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  confirmed:  { label: 'Order Confirmed',  icon: '✅', color: '#4B8B3B' },
  processing: { label: 'Being Prepared',   icon: '📦', color: '#f59e0b' },
  shipped:    { label: 'Out for Delivery', icon: '🚚', color: '#3b82f6' },
  delivered:  { label: 'Delivered!',       icon: '🎉', color: '#22c55e' },
  cancelled:  { label: 'Order Cancelled',  icon: '❌', color: '#ef4444' },
};

export function orderStatusTemplate(order: {
  orderNumber: string;
  customerName: string;
  status: string;
  totalAmount: number;
}) {
  const info = STATUS_LABELS[order.status] || { label: order.status, icon: '📋', color: '#737373' };
  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f9fafb;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
    <div style="background:${info.color};padding:24px;text-align:center">
      <div style="font-size:48px">${info.icon}</div>
      <h2 style="color:#fff;margin:8px 0 0">${info.label}</h2>
    </div>
    <div style="padding:24px">
      <p>Dear <strong>${order.customerName}</strong>,</p>
      <p>Your order <strong>${order.orderNumber}</strong> (PKR ${order.totalAmount.toFixed(0)}) is now: <strong>${info.label}</strong></p>
      <div style="background:#f0f9f0;padding:16px;border-radius:8px;margin-top:16px">
        <p style="margin:0;color:#3d7030">Questions? WhatsApp: ${env.ADMIN_WHATSAPP}</p>
      </div>
    </div>
  </div></body></html>`;
}
