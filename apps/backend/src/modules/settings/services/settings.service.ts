import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Setting, SettingType, SettingCategory } from '../entities/setting.entity';

@Injectable()
export class SettingsService {
  private readonly CACHE_DURATION = 300000; // 5 minutes in milliseconds

  constructor(
    @InjectRepository(Setting)
    private settingsRepository: Repository<Setting>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Get setting value with Redis caching
   */
  async getSetting(key: string, defaultValue?: any): Promise<any> {
    const cacheKey = `settings:${key}`;
    
    // Check Redis cache first
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached !== undefined && cached !== null) {
      return cached;
    }

    // Fetch from database
    const setting = await this.settingsRepository.findOne({
      where: { key, isActive: true }
    });

    if (!setting) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Setting '${key}' not found`);
    }

    // Parse value based on type
    const value = this.parseSettingValue(setting);
    
    // Cache the value in Redis
    await this.cacheManager.set(cacheKey, value, this.CACHE_DURATION);

    return value;
  }

  /**
   * Get multiple settings at once
   */
  async getSettings(keys: string[]): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    
    for (const key of keys) {
      try {
        result[key] = await this.getSetting(key);
      } catch (error) {
        // Skip missing settings
        continue;
      }
    }

    return result;
  }

  /**
   * Get all settings by category
   */
  async getSettingsByCategory(category: SettingCategory): Promise<Record<string, any>> {
    const settings = await this.settingsRepository.find({
      where: { category, isActive: true },
      order: { sortOrder: 'ASC' }
    });

    const result: Record<string, any> = {};
    for (const setting of settings) {
      result[setting.key] = this.parseSettingValue(setting);
    }

    return result;
  }

  /**
   * Set setting value
   */
  async setSetting(key: string, value: any): Promise<void> {
    let setting = await this.settingsRepository.findOne({
      where: { key }
    });

    if (!setting) {
      // Create new setting if it doesn't exist
      const newSetting = new Setting();
      newSetting.key = key;
      newSetting.name = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      newSetting.value = this.serializeSettingValue(SettingType.STRING, value);
      newSetting.type = SettingType.STRING;
      newSetting.category = SettingCategory.DELIVERY;
      newSetting.isActive = true;
      newSetting.isRequired = false;
      
      await this.settingsRepository.save(newSetting);
    } else {
      // Validate value for existing setting
      this.validateSettingValue(setting, value);

      // Update existing setting
      await this.settingsRepository.update(
        { key },
        { value: this.serializeSettingValue(setting.type, value) }
      );
    }

    // Clear Redis cache
    await this.cacheManager.del(`settings:${key}`);
  }

  /**
   * Create new setting
   */
  async createSetting(data: {
    key: string;
    name: string;
    description?: string;
    value: any;
    type: SettingType;
    category: SettingCategory;
    isRequired?: boolean;
    validation?: any;
    defaultValue?: any;
    options?: any;
    helpText?: string;
    sortOrder?: number;
    metadata?: Record<string, any>;
  }): Promise<Setting> {
    const setting = this.settingsRepository.create({
      key: data.key,
      name: data.name,
      description: data.description,
      value: this.serializeSettingValue(data.type, data.value),
      type: data.type,
      category: data.category,
      isActive: true,
      isRequired: false,
      defaultValue: data.defaultValue ? this.serializeSettingValue(data.type, data.defaultValue) : null,
      validation: data.validation ? JSON.stringify(data.validation) : null,
      options: data.options ? JSON.stringify(data.options) : null,
      helpText: data.helpText,
      sortOrder: data.sortOrder ?? 0,
      metadata: data.metadata || null
    });

    return this.settingsRepository.save(setting);
  }

  /**
   * Get delivery settings
   */
  async getDeliverySettings(): Promise<{
    isDeliveryEnabled: boolean | null;
    deliveryFee: number | null;
    freeDeliveryThreshold: number | null;
  }> {
    try {
      const isDeliveryEnabled = await this.getSetting('delivery_enabled');
      const deliveryFee = await this.getSetting('delivery_fee');
      const freeDeliveryThreshold = await this.getSetting('free_delivery_threshold');

      return {
        isDeliveryEnabled: isDeliveryEnabled === 'true',
        deliveryFee: parseFloat(deliveryFee),
        freeDeliveryThreshold: parseFloat(freeDeliveryThreshold)
      };
    } catch (error) {
      // If settings don't exist, return null values so user can see empty form
      return {
        isDeliveryEnabled: null,
        deliveryFee: null,
        freeDeliveryThreshold: null
      };
    }
  }

  /**
   * Get all settings
   */
  async getAllSettings(): Promise<Record<string, any>> {
    const settings = await this.settingsRepository.find({
      where: { isActive: true },
      order: { category: 'ASC', sortOrder: 'ASC' }
    });

    const result: Record<string, any> = {};
    for (const setting of settings) {
      result[setting.key] = this.parseSettingValue(setting);
    }

    return result;
  }

  /**
   * Clear settings cache (Redis handles TTL automatically, but this can be used for manual clearing)
   */
  async clearCache(): Promise<void> {
    // Redis cache expires automatically based on TTL
    // If needed, we could implement pattern-based deletion here
  }

  /**
   * Parse setting value based on type
   */
  private parseSettingValue(setting: Setting): any {
    switch (setting.type) {
      case SettingType.STRING:
        return setting.value;
      case SettingType.NUMBER:
        return parseFloat(setting.value);
      case SettingType.BOOLEAN:
        return setting.value === 'true';
      case SettingType.JSON:
        return JSON.parse(setting.value);
      case SettingType.ARRAY:
        return JSON.parse(setting.value);
      default:
        return setting.value;
    }
  }

  /**
   * Serialize setting value based on type
   */
  private serializeSettingValue(type: SettingType, value: any): string {
    switch (type) {
      case SettingType.STRING:
        return String(value);
      case SettingType.NUMBER:
        return String(Number(value));
      case SettingType.BOOLEAN:
        return String(Boolean(value));
      case SettingType.JSON:
        return JSON.stringify(value);
      case SettingType.ARRAY:
        return JSON.stringify(value);
      default:
        return String(value);
    }
  }

  /**
   * Validate setting value
   */
  private validateSettingValue(setting: Setting, value: any): void {
    if (setting.validation) {
      const validation = JSON.parse(setting.validation);
      
      if (validation.min !== undefined && value < validation.min) {
        throw new Error(`Value must be at least ${validation.min}`);
      }
      
      if (validation.max !== undefined && value > validation.max) {
        throw new Error(`Value must be at most ${validation.max}`);
      }
      
      if (validation.pattern && !new RegExp(validation.pattern).test(String(value))) {
        throw new Error(`Value does not match required pattern`);
      }
      
      if (validation.options && !validation.options.includes(value)) {
        throw new Error(`Value must be one of: ${validation.options.join(', ')}`);
      }
    }
  }

  /**
   * Initialize default settings
   */
  async initializeDefaultSettings(): Promise<void> {
    const defaultSettings = [
      // General Settings
      {
        key: 'app_name',
        name: 'Application Name',
        description: 'Name of the application',
        value: 'Khaalis Harvest',
        type: SettingType.STRING,
        category: SettingCategory.GENERAL,
        isRequired: true,
        sortOrder: 1
      },
      {
        key: 'app_description',
        name: 'Application Description',
        description: 'Description of the application',
        value: 'Fresh organic products marketplace',
        type: SettingType.STRING,
        category: SettingCategory.GENERAL,
        sortOrder: 2
      },

      // Inventory Settings
      {
        key: 'default_pagination_limit',
        name: 'Default Pagination Limit',
        description: 'Default number of items per page',
        value: 20,
        type: SettingType.NUMBER,
        category: SettingCategory.INVENTORY,
        validation: { min: 1, max: 100 },
        sortOrder: 1
      },
      {
        key: 'max_pagination_limit',
        name: 'Maximum Pagination Limit',
        description: 'Maximum number of items per page',
        value: 100,
        type: SettingType.NUMBER,
        category: SettingCategory.INVENTORY,
        validation: { min: 1, max: 1000 },
        sortOrder: 2
      },
      {
        key: 'low_stock_threshold',
        name: 'Low Stock Threshold',
        description: 'Threshold for low stock alerts',
        value: 10,
        type: SettingType.NUMBER,
        category: SettingCategory.INVENTORY,
        validation: { min: 0, max: 1000 },
        sortOrder: 3
      },
      {
        key: 'default_marketplace_min_quantity',
        name: 'Default Marketplace Minimum Quantity',
        description: 'Default minimum order quantity for marketplace products',
        value: 1,
        type: SettingType.NUMBER,
        category: SettingCategory.INVENTORY,
        validation: { min: 1, max: 1000 },
        sortOrder: 4
      },
      {
        key: 'default_marketplace_max_quantity',
        name: 'Default Marketplace Maximum Quantity',
        description: 'Default maximum order quantity for marketplace products',
        value: 999999,
        type: SettingType.NUMBER,
        category: SettingCategory.INVENTORY,
        validation: { min: 1, max: 9999999 },
        sortOrder: 5
      },

      // Order Settings
      {
        key: 'min_order_amount',
        name: 'Minimum Order Amount',
        description: 'Minimum order amount in PKR',
        value: 500,
        type: SettingType.NUMBER,
        category: SettingCategory.ORDERS,
        validation: { min: 0, max: 100000 },
        sortOrder: 1
      },
      {
        key: 'max_order_amount',
        name: 'Maximum Order Amount',
        description: 'Maximum order amount in PKR',
        value: 50000,
        type: SettingType.NUMBER,
        category: SettingCategory.ORDERS,
        validation: { min: 0, max: 1000000 },
        sortOrder: 2
      },

      // Delivery Settings
      {
        key: 'delivery_fee',
        name: 'Delivery Fee',
        description: 'Standard delivery fee in PKR',
        value: 150,
        type: SettingType.NUMBER,
        category: SettingCategory.DELIVERY,
        validation: { min: 0, max: 10000 },
        sortOrder: 1
      },
      {
        key: 'free_delivery_threshold',
        name: 'Free Delivery Threshold',
        description: 'Minimum order amount for free delivery in PKR',
        value: 2000,
        type: SettingType.NUMBER,
        category: SettingCategory.DELIVERY,
        validation: { min: 0, max: 100000 },
        sortOrder: 2
      },
      {
        key: 'is_delivery_enabled',
        name: 'Delivery Enabled',
        description: 'Whether delivery service is enabled',
        value: true,
        type: SettingType.BOOLEAN,
        category: SettingCategory.DELIVERY,
        sortOrder: 3
      },

      // UI Settings
      {
        key: 'default_currency',
        name: 'Default Currency',
        description: 'Default currency code',
        value: 'PKR',
        type: SettingType.STRING,
        category: SettingCategory.UI,
        options: ['PKR', 'USD', 'EUR', 'GBP'],
        sortOrder: 1
      },
      {
        key: 'default_language',
        name: 'Default Language',
        description: 'Default language code',
        value: 'en',
        type: SettingType.STRING,
        category: SettingCategory.UI,
        options: ['en', 'ur', 'ar'],
        sortOrder: 2
      },

      // Performance Settings
      {
        key: 'cache_duration',
        name: 'Cache Duration',
        description: 'Cache duration in milliseconds',
        value: 300000,
        type: SettingType.NUMBER,
        category: SettingCategory.PERFORMANCE,
        validation: { min: 60000, max: 3600000 },
        sortOrder: 1
      },
      {
        key: 'max_search_results',
        name: 'Maximum Search Results',
        description: 'Maximum number of search results to return',
        value: 1000,
        type: SettingType.NUMBER,
        category: SettingCategory.PERFORMANCE,
        validation: { min: 10, max: 10000 },
        sortOrder: 2
      }
    ];

    for (const settingData of defaultSettings) {
      const existing = await this.settingsRepository.findOne({
        where: { key: settingData.key }
      });

      if (!existing) {
        await this.createSetting(settingData);
      }
    }
  }

  /**
   * Update delivery settings
   */
  async updateDeliverySettings(data: {
    deliveryFee: number;
    freeDeliveryThreshold: number;
    isDeliveryEnabled: boolean;
  }): Promise<void> {
    await this.setSetting('delivery_fee', data.deliveryFee);
    await this.setSetting('free_delivery_threshold', data.freeDeliveryThreshold);
    await this.setSetting('delivery_enabled', data.isDeliveryEnabled);
  }

  /**
   * Get notification bar settings
   */
  async getNotificationBarSettings(): Promise<{
    isEnabled: boolean;
    text: string;
    backgroundColor: string;
    textColor: string;
    speed: number;
  }> {
    try {
      const isEnabled = await this.getSetting('notification_bar_enabled', false);
      const text = await this.getSetting('notification_bar_text', '');
      const backgroundColor = await this.getSetting('notification_bar_bg_color', '#FF6B35');
      const textColor = await this.getSetting('notification_bar_text_color', '#FFFFFF');
      const speed = await this.getSetting('notification_bar_speed', 50);

      return {
        isEnabled: isEnabled === true || isEnabled === 'true',
        text: text || '',
        backgroundColor: backgroundColor || '#FF6B35',
        textColor: textColor || '#FFFFFF',
        speed: typeof speed === 'number' ? speed : (typeof speed === 'string' ? parseFloat(speed) : 50) || 50
      };
    } catch (error) {
      // Return defaults if settings don't exist
      return {
        isEnabled: false,
        text: '',
        backgroundColor: '#FF6B35',
        textColor: '#FFFFFF',
        speed: 50
      };
    }
  }

  /**
   * Update notification bar settings
   */
  async updateNotificationBarSettings(data: {
    isEnabled: boolean;
    text: string;
    backgroundColor: string;
    textColor: string;
    speed: number;
  }): Promise<void> {
    await this.setSetting('notification_bar_enabled', data.isEnabled);
    await this.setSetting('notification_bar_text', data.text);
    await this.setSetting('notification_bar_bg_color', data.backgroundColor);
    await this.setSetting('notification_bar_text_color', data.textColor);
    await this.setSetting('notification_bar_speed', data.speed);
  }
}
