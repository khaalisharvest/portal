import { env } from '../../../config/env';

export function orderConfirmationTemplate(order: {
  orderNumber: string;
  customerName: string;
  items: Array<{ itemName: string; quantity: number; unitPrice: number; unit: string }>;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: string;
  address: string;
}) {
  const itemsRows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">${i.itemName}</td>` +
        `<td style="padding:8px;border-bottom:1px solid #e5e7eb">${i.quantity} ${i.unit}</td>` +
        `<td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">PKR ${i.unitPrice.toFixed(0)}</td></tr>`,
    )
    .join('');
  const paymentLabel = order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Bank Transfer';

  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f9fafb;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
    <div style="background:#4B8B3B;padding:24px;text-align:center">
      <h1 style="color:#fff;margin:0">🌿 Khaalis Harvest</h1>
      <p style="color:#dcf2dc;margin:4px 0 0">Order Confirmed!</p>
    </div>
    <div style="padding:24px">
      <p>Dear <strong>${order.customerName}</strong>,</p>
      <p>Your order <strong>${order.orderNumber}</strong> has been placed. We will contact you shortly.</p>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#f0f9f0">
          <th style="padding:8px;text-align:left">Item</th>
          <th style="padding:8px;text-align:left">Qty</th>
          <th style="padding:8px;text-align:right">Price</th>
        </tr></thead>
        <tbody>${itemsRows}</tbody>
        <tfoot>
          <tr><td colspan="2" style="padding:8px">Subtotal</td><td style="padding:8px;text-align:right">PKR ${order.subtotal.toFixed(0)}</td></tr>
          <tr><td colspan="2" style="padding:8px">Delivery</td><td style="padding:8px;text-align:right">PKR ${order.deliveryFee.toFixed(0)}</td></tr>
          <tr style="font-weight:bold;background:#f0f9f0"><td colspan="2" style="padding:8px">Total</td><td style="padding:8px;text-align:right;color:#4B8B3B">PKR ${order.totalAmount.toFixed(0)}</td></tr>
        </tfoot>
      </table>
      <p><strong>Payment:</strong> ${paymentLabel}</p>
      <p><strong>Deliver to:</strong> ${order.address}</p>
      <div style="background:#f0f9f0;padding:16px;border-radius:8px;margin-top:16px">
        <p style="margin:0;color:#3d7030">Questions? WhatsApp: ${env.ADMIN_WHATSAPP}</p>
      </div>
    </div>
    <div style="background:#f9fafb;padding:16px;text-align:center;color:#737373;font-size:12px">
      Khaalis Harvest — Pure Organic Products • Fresh • Local • Delivered
    </div>
  </div></body></html>`;
}

export function adminNewOrderTemplate(order: {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  paymentMethod: string;
  city: string;
  itemCount: number;
}) {
  const paymentLabel = order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Bank Transfer';
  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f9fafb;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
    <div style="background:#4B8B3B;padding:24px;text-align:center">
      <h1 style="color:#fff;margin:0">🛒 New Order Received</h1>
    </div>
    <div style="padding:24px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px;font-weight:bold">Order</td><td style="padding:8px">${order.orderNumber}</td></tr>
        <tr style="background:#f9fafb"><td style="padding:8px;font-weight:bold">Customer</td><td style="padding:8px">${order.customerName}</td></tr>
        <tr><td style="padding:8px;font-weight:bold">Phone</td><td style="padding:8px">${order.customerPhone}</td></tr>
        <tr style="background:#f9fafb"><td style="padding:8px;font-weight:bold">City</td><td style="padding:8px">${order.city}</td></tr>
        <tr><td style="padding:8px;font-weight:bold">Items</td><td style="padding:8px">${order.itemCount}</td></tr>
        <tr style="background:#f0f9f0"><td style="padding:8px;font-weight:bold;color:#4B8B3B">Total</td><td style="padding:8px;font-weight:bold;color:#4B8B3B">PKR ${order.totalAmount.toFixed(0)}</td></tr>
        <tr><td style="padding:8px;font-weight:bold">Payment</td><td style="padding:8px">${paymentLabel}</td></tr>
      </table>
      <p style="margin-top:16px;color:#737373;font-size:12px">Log in to admin panel to process this order.</p>
    </div>
  </div></body></html>`;
}
