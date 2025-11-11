import { API_URL } from '@/config/env';

export interface AppConfig {
  // Pagination
  defaultPaginationLimit: number;
  maxPaginationLimit: number;
  
  // Inventory
  lowStockThreshold: number;
  defaultMarketplaceMinQuantity: number;
  defaultMarketplaceMaxQuantity: number;
  
  // Orders
  minOrderAmount: number;
  maxOrderAmount: number;
  
  // Delivery
  deliveryFee: number;
  freeDeliveryThreshold: number;
  isDeliveryEnabled: boolean;
  
  // UI
  defaultCurrency: string;
  defaultLanguage: string;
  
  // Performance
  cacheDuration: number;
  maxSearchResults: number;
  
  // App Info
  appName: string;
  appDescription: string;
}

class ConfigService {
  private config: AppConfig | null = null;
  private configPromise: Promise<AppConfig> | null = null;

  async getConfig(): Promise<AppConfig> {
    if (this.config) {
      return this.config;
    }

    if (this.configPromise) {
      return this.configPromise;
    }

    this.configPromise = this.fetchConfig();
    this.config = await this.configPromise;
    return this.config;
  }

  private async fetchConfig(): Promise<AppConfig> {
    try {
      const deliveryResponse = await fetch(`/api/v1/settings/delivery`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('backend_token')}`,
        },
      });
      
      if (!deliveryResponse.ok) {
        throw new Error('Failed to fetch delivery settings');
      }
      
      const deliveryResponseData = await deliveryResponse.json();
      const deliverySettings = deliveryResponseData.data || deliveryResponseData;
      
      return {
        // Pagination
        defaultPaginationLimit: 20,
        maxPaginationLimit: 100,
        
        // Inventory
        lowStockThreshold: 10,
        defaultMarketplaceMinQuantity: 1,
        defaultMarketplaceMaxQuantity: 999999,
        
        // Orders
        minOrderAmount: 500,
        maxOrderAmount: 50000,
        
        // Delivery - Use backend settings only
        deliveryFee: deliverySettings.deliveryFee,
        freeDeliveryThreshold: deliverySettings.freeDeliveryThreshold,
        isDeliveryEnabled: deliverySettings.isDeliveryEnabled,
        
        // UI
        defaultCurrency: 'PKR',
        defaultLanguage: 'en',
        
        // Performance
        cacheDuration: 300000,
        maxSearchResults: 1000,
        
        // App Info
        appName: 'Khaalis Harvest',
        appDescription: 'Fresh organic products marketplace'
      };
    } catch (error) {
      console.error('Failed to fetch configuration:', error);
      throw error; // Don't fallback, let the error propagate
    }
  }

  async refreshConfig(): Promise<AppConfig> {
    this.config = null;
    this.configPromise = null;
    return this.getConfig();
  }

  // Helper methods for common config values
  async getPaginationLimit(requestedLimit?: number): Promise<number> {
    const config = await this.getConfig();
    return Math.min(requestedLimit || config.defaultPaginationLimit, config.maxPaginationLimit);
  }

  async getLowStockThreshold(): Promise<number> {
    const config = await this.getConfig();
    return config.lowStockThreshold;
  }

  async getDeliverySettings() {
    try {
      const config = await this.getConfig();
      return {
        deliveryFee: config.deliveryFee,
        freeDeliveryThreshold: config.freeDeliveryThreshold,
        isDeliveryEnabled: config.isDeliveryEnabled
      };
    } catch (error) {
      console.error('Failed to get delivery settings:', error);
      throw new Error('Unable to load delivery settings. Please try again.');
    }
  }

  async getOrderLimits() {
    const config = await this.getConfig();
    return {
      minOrderAmount: config.minOrderAmount,
      maxOrderAmount: config.maxOrderAmount
    };
  }

  async getMarketplaceLimits() {
    const config = await this.getConfig();
    return {
      minQuantity: config.defaultMarketplaceMinQuantity,
      maxQuantity: config.defaultMarketplaceMaxQuantity
    };
  }
}

export const configService = new ConfigService();
