import { APP_NAME, APP_DESCRIPTION, DEFAULT_CURRENCY, DEFAULT_LANGUAGE } from '@/config/env';

export interface AppConfig {
  // Delivery — always from DB via /api/v1/settings/delivery
  deliveryFee: number;
  freeDeliveryThreshold: number;
  isDeliveryEnabled: boolean;

  // UI — from .env only
  defaultCurrency: string | undefined;
  defaultLanguage: string | undefined;
  appName: string | undefined;
  appDescription: string | undefined;
}

class ConfigService {
  private config: AppConfig | null = null;
  private configPromise: Promise<AppConfig> | null = null;

  async getConfig(): Promise<AppConfig> {
    if (this.config) return this.config;
    if (this.configPromise) return this.configPromise;
    this.configPromise = this.fetchConfig();
    this.config = await this.configPromise;
    return this.config;
  }

  private async fetchConfig(): Promise<AppConfig> {
    const res = await fetch('/api/v1/settings/delivery');
    if (!res.ok) throw new Error('Failed to fetch delivery settings');
    const json = await res.json();
    const d = json.data ?? json;

    return {
      // Delivery values come exclusively from the database — no hardcoded fallbacks
      deliveryFee:          d.deliveryFee,
      freeDeliveryThreshold: d.freeDeliveryThreshold,
      isDeliveryEnabled:    d.isDeliveryEnabled,

      defaultCurrency: DEFAULT_CURRENCY,
      defaultLanguage: DEFAULT_LANGUAGE,
      appName:         APP_NAME,
      appDescription:  APP_DESCRIPTION,
    };
  }

  async refreshConfig(): Promise<AppConfig> {
    this.config = null;
    this.configPromise = null;
    return this.getConfig();
  }

  async getDeliverySettings() {
    const config = await this.getConfig();
    return {
      deliveryFee:          config.deliveryFee,
      freeDeliveryThreshold: config.freeDeliveryThreshold,
      isDeliveryEnabled:    config.isDeliveryEnabled,
    };
  }
}

export const configService = new ConfigService();
