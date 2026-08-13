// All requests go through Next.js BFF routes — auth handled via HttpOnly cookie
const API_BASE = '/api/v1';

export interface DeliverySettings {
  deliveryFee: number;
  freeDeliveryThreshold: number;
  isDeliveryEnabled: boolean;
}

export interface DeliveryCalculation {
  deliveryFee: number;
  isFree: boolean;
  reason: string;
}

export const settingsApi = {
  async getDeliverySettings(): Promise<DeliverySettings> {
    const response = await fetch(`${API_BASE}/settings/delivery`);
    if (!response.ok) throw new Error('Failed to fetch delivery settings');
    const result = await response.json();
    return result.success && result.data ? result.data : result;
  },

  async updateDeliverySettings(settings: DeliverySettings): Promise<void> {
    const response = await fetch(`${API_BASE}/settings/delivery`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error('Failed to update delivery settings');
  },

  async calculateDeliveryFee(orderAmount: number): Promise<DeliveryCalculation> {
    const response = await fetch(`/api/public/settings/delivery/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderAmount }),
    });
    if (!response.ok) throw new Error('Failed to calculate delivery fee');
    const result = await response.json();
    return result.success && result.data ? result.data : result;
  },
};
