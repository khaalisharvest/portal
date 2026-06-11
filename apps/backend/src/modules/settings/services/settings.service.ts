import { Injectable, Inject, Optional, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Setting, SettingType } from '../entities/setting.entity';
import { CACHE_KEYS } from '../../../common/constants/cache-keys';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private readonly CACHE_DURATION = 300000;

  constructor(
    @InjectRepository(Setting)
    private settingsRepository: Repository<Setting>,
    @Optional() @Inject(CACHE_MANAGER) private cacheManager?: Cache,
  ) {}

  async getSetting(key: string, defaultValue?: any): Promise<any> {
    const cacheKey = CACHE_KEYS.SETTINGS.BY_KEY(key);

    if (this.cacheManager) {
      try {
        const cached = await this.cacheManager.get<any>(cacheKey);
        if (cached !== undefined && cached !== null) return cached;
      } catch (e) {
        this.logger.warn(`Cache get failed for ${cacheKey}: ${e.message}`);
      }
    }

    const setting = await this.settingsRepository.findOne({ where: { key, isActive: true } });

    if (!setting) {
      if (defaultValue !== undefined) return defaultValue;
      throw new Error(`Setting '${key}' not found`);
    }

    const value = this.parseValue(setting);

    if (this.cacheManager) {
      try {
        await this.cacheManager.set(cacheKey, value, this.CACHE_DURATION);
      } catch (e) {
        this.logger.warn(`Cache set failed for ${cacheKey}: ${e.message}`);
      }
    }

    return value;
  }

  async setSetting(key: string, value: any): Promise<void> {
    const setting = await this.settingsRepository.findOne({ where: { key } });

    if (!setting) {
      let inferredType = SettingType.STRING;
      if (typeof value === 'number') inferredType = SettingType.NUMBER;
      else if (typeof value === 'boolean') inferredType = SettingType.BOOLEAN;
      else if (typeof value === 'object' && value !== null) inferredType = SettingType.JSON;

      const newSetting = this.settingsRepository.create({
        key,
        name: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        value: this.serializeValue(inferredType, value),
        type: inferredType,
        category: 'system',
        isActive: true,
      });
      await this.settingsRepository.save(newSetting);
    } else {
      if (setting.validation) {
        this.validateValue(setting, value);
      }
      await this.settingsRepository.update({ key }, { value: this.serializeValue(setting.type, value) });
    }

    await this.clearCache(key, setting?.category);
  }

  async bulkUpdate(updates: { key: string; value: any }[]): Promise<void> {
    for (const update of updates) {
      await this.setSetting(update.key, update.value);
    }
  }

  async getAllSettings(): Promise<Record<string, any>> {
    const settings = await this.settingsRepository.find({
      where: { isActive: true },
      order: { category: 'ASC', sortOrder: 'ASC' },
    });
    const result: Record<string, any> = {};
    for (const s of settings) {
      result[s.key] = this.parseValue(s);
    }
    return result;
  }

  // Public-safe settings — returned without auth, safe to show in frontend
  async getPublicSettings(): Promise<Record<string, any>> {
    const publicKeys = [
      'delivery_fee', 'free_delivery_threshold', 'is_delivery_enabled', 'cod_enabled',
      'min_order_amount',
      'bank_name', 'bank_account_name', 'bank_account_number', 'bank_iban',
      'admin_whatsapp',
      'store_maintenance_mode',
      'instagram_url', 'facebook_url', 'tiktok_url',
      'notification_bar_enabled', 'notification_bar_text',
      'notification_bar_bg_color', 'notification_bar_text_color', 'notification_bar_speed',
    ];
    const rows = await this.settingsRepository.find({
      where: { key: In(publicKeys), isActive: true },
    });
    const result: Record<string, any> = {};
    for (const row of rows) {
      result[row.key] = this.parseValue(row);
    }
    return result;
  }

  // ─── Delivery ───────────────────────────────────────────────────────────────

  async getDeliverySettings(): Promise<{
    isDeliveryEnabled: boolean;
    deliveryFee: number;
    freeDeliveryThreshold: number;
  }> {
    return {
      isDeliveryEnabled: this.asBool(await this.getSetting('is_delivery_enabled')),
      deliveryFee: this.asNum(await this.getSetting('delivery_fee')),
      freeDeliveryThreshold: this.asNum(await this.getSetting('free_delivery_threshold')),
    };
  }

  async updateDeliverySettings(data: {
    deliveryFee: number;
    freeDeliveryThreshold: number;
    isDeliveryEnabled: boolean;
  }): Promise<void> {
    await this.setSetting('delivery_fee', data.deliveryFee);
    await this.setSetting('free_delivery_threshold', data.freeDeliveryThreshold);
    await this.setSetting('is_delivery_enabled', data.isDeliveryEnabled);
  }

  // ─── Notification bar ────────────────────────────────────────────────────────

  async getNotificationBarSettings(): Promise<{
    isEnabled: boolean;
    text: string;
    backgroundColor: string;
    textColor: string;
    speed: number;
  }> {
    return {
      isEnabled: this.asBool(await this.getSetting('notification_bar_enabled', false)),
      text: String(await this.getSetting('notification_bar_text', '')),
      backgroundColor: String(await this.getSetting('notification_bar_bg_color', '#FF6B35')),
      textColor: String(await this.getSetting('notification_bar_text_color', '#FFFFFF')),
      speed: this.asNum(await this.getSetting('notification_bar_speed', 50)),
    };
  }

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

  // ─── Payment (bank details) ──────────────────────────────────────────────────

  async getPaymentSettings(): Promise<{
    bankName: string;
    bankAccountName: string;
    bankAccountNumber: string;
    bankIban: string;
    codEnabled: boolean;
  }> {
    return {
      bankName: String(await this.getSetting('bank_name', '')),
      bankAccountName: String(await this.getSetting('bank_account_name', '')),
      bankAccountNumber: String(await this.getSetting('bank_account_number', '')),
      bankIban: String(await this.getSetting('bank_iban', '')),
      codEnabled: this.asBool(await this.getSetting('cod_enabled', true)),
    };
  }

  async updatePaymentSettings(data: {
    bankName: string;
    bankAccountName: string;
    bankAccountNumber: string;
    bankIban: string;
    codEnabled: boolean;
  }): Promise<void> {
    await this.setSetting('bank_name', data.bankName);
    await this.setSetting('bank_account_name', data.bankAccountName);
    await this.setSetting('bank_account_number', data.bankAccountNumber);
    await this.setSetting('bank_iban', data.bankIban);
    await this.setSetting('cod_enabled', data.codEnabled);
  }

  // ─── Contact ─────────────────────────────────────────────────────────────────

  async getContactSettings(): Promise<{ adminEmail: string; adminWhatsapp: string }> {
    return {
      adminEmail: String(await this.getSetting('admin_email', '')),
      adminWhatsapp: String(await this.getSetting('admin_whatsapp', '')),
    };
  }

  async updateContactSettings(data: { adminEmail: string; adminWhatsapp: string }): Promise<void> {
    await this.setSetting('admin_email', data.adminEmail);
    await this.setSetting('admin_whatsapp', data.adminWhatsapp);
  }

  // ─── Social links ────────────────────────────────────────────────────────────

  async getSocialSettings(): Promise<{ instagramUrl: string; facebookUrl: string; tiktokUrl: string }> {
    return {
      instagramUrl: String(await this.getSetting('instagram_url', '')),
      facebookUrl: String(await this.getSetting('facebook_url', '')),
      tiktokUrl: String(await this.getSetting('tiktok_url', '')),
    };
  }

  async updateSocialSettings(data: {
    instagramUrl: string;
    facebookUrl: string;
    tiktokUrl: string;
  }): Promise<void> {
    await this.setSetting('instagram_url', data.instagramUrl);
    await this.setSetting('facebook_url', data.facebookUrl);
    await this.setSetting('tiktok_url', data.tiktokUrl);
  }

  // ─── Store ───────────────────────────────────────────────────────────────────

  async getStoreSettings(): Promise<{ maintenanceMode: boolean }> {
    return { maintenanceMode: this.asBool(await this.getSetting('store_maintenance_mode', false)) };
  }

  async updateStoreSettings(data: { maintenanceMode: boolean }): Promise<void> {
    await this.setSetting('store_maintenance_mode', data.maintenanceMode);
  }

  // ─── Orders ──────────────────────────────────────────────────────────────────

  async getOrderSettings(): Promise<{ minOrderAmount: number }> {
    return { minOrderAmount: this.asNum(await this.getSetting('min_order_amount')) };
  }

  async updateOrderSettings(data: { minOrderAmount: number }): Promise<void> {
    await this.setSetting('min_order_amount', data.minOrderAmount);
  }

  // ─── Seed ────────────────────────────────────────────────────────────────────

  async initializeDefaultSettings(): Promise<void> {
    // Migrate legacy key delivery_enabled → is_delivery_enabled
    const legacyKey = await this.settingsRepository.findOne({ where: { key: 'delivery_enabled' } });
    if (legacyKey) {
      await this.settingsRepository.update({ key: 'delivery_enabled' }, { key: 'is_delivery_enabled' });
    }

    const defaults: Array<{
      key: string;
      name: string;
      description: string;
      value: any;
      type: SettingType;
      category: string;
      sortOrder: number;
      validation?: any;
    }> = [
      // Delivery
      { key: 'delivery_fee', name: 'Delivery Fee', description: 'Standard delivery fee in PKR', value: 150, type: SettingType.NUMBER, category: 'delivery', sortOrder: 1, validation: { min: 0, max: 10000 } },
      { key: 'free_delivery_threshold', name: 'Free Delivery Threshold', description: 'Minimum order amount for free delivery in PKR', value: 2000, type: SettingType.NUMBER, category: 'delivery', sortOrder: 2, validation: { min: 0, max: 100000 } },
      { key: 'is_delivery_enabled', name: 'Delivery Enabled', description: 'Whether delivery service is currently active', value: true, type: SettingType.BOOLEAN, category: 'delivery', sortOrder: 3 },
      // Orders
      { key: 'min_order_amount', name: 'Minimum Order Amount', description: 'Minimum order subtotal in PKR', value: 500, type: SettingType.NUMBER, category: 'orders', sortOrder: 1, validation: { min: 0, max: 100000 } },
      // Inventory
      { key: 'low_stock_threshold', name: 'Low Stock Threshold', description: 'Units remaining before a product is flagged as low stock', value: 10, type: SettingType.NUMBER, category: 'inventory', sortOrder: 1, validation: { min: 0, max: 1000 } },
      // Payment
      { key: 'cod_enabled', name: 'Cash on Delivery Enabled', description: 'Whether customers can pay with cash on delivery', value: true, type: SettingType.BOOLEAN, category: 'payment', sortOrder: 1 },
      { key: 'bank_name', name: 'Bank Name', description: 'Bank name shown to customers at checkout', value: process.env.BANK_NAME, type: SettingType.STRING, category: 'payment', sortOrder: 2 },
      { key: 'bank_account_name', name: 'Bank Account Name', description: 'Account holder name shown to customers at checkout', value: process.env.BANK_ACCOUNT_NAME, type: SettingType.STRING, category: 'payment', sortOrder: 3 },
      { key: 'bank_account_number', name: 'Bank Account Number', description: 'Account number shown to customers at checkout', value: process.env.BANK_ACCOUNT_NUMBER, type: SettingType.STRING, category: 'payment', sortOrder: 4 },
      { key: 'bank_iban', name: 'Bank IBAN', description: 'IBAN shown to customers at checkout', value: process.env.BANK_IBAN, type: SettingType.STRING, category: 'payment', sortOrder: 5 },
      // Contact
      { key: 'admin_email', name: 'Admin Email', description: 'Email address where order notifications are sent', value: process.env.ADMIN_EMAIL, type: SettingType.STRING, category: 'contact', sortOrder: 1 },
      { key: 'admin_whatsapp', name: 'Admin WhatsApp', description: 'WhatsApp number shown to customers for support', value: process.env.ADMIN_WHATSAPP, type: SettingType.STRING, category: 'contact', sortOrder: 2 },
      // Store
      { key: 'store_maintenance_mode', name: 'Maintenance Mode', description: 'When enabled, customers see a maintenance message and cannot place orders', value: false, type: SettingType.BOOLEAN, category: 'store', sortOrder: 1 },
      // Social
      { key: 'instagram_url', name: 'Instagram URL', description: 'Instagram profile link shown in footer', value: '', type: SettingType.STRING, category: 'social', sortOrder: 1 },
      { key: 'facebook_url', name: 'Facebook URL', description: 'Facebook page link shown in footer', value: '', type: SettingType.STRING, category: 'social', sortOrder: 2 },
      { key: 'tiktok_url', name: 'TikTok URL', description: 'TikTok profile link shown in footer', value: '', type: SettingType.STRING, category: 'social', sortOrder: 3 },
    ];

    for (const item of defaults) {
      const existing = await this.settingsRepository.findOne({ where: { key: item.key } });
      if (!existing) {
        await this.settingsRepository.save(
          this.settingsRepository.create({
            key: item.key,
            name: item.name,
            description: item.description,
            value: this.serializeValue(item.type, item.value),
            type: item.type,
            category: item.category,
            sortOrder: item.sortOrder,
            isActive: true,
            isRequired: false,
            validation: item.validation ? JSON.stringify(item.validation) : undefined,
          }),
        );
      }
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private parseValue(setting: Setting): any {
    switch (setting.type) {
      case SettingType.NUMBER:  return parseFloat(setting.value);
      case SettingType.BOOLEAN: return setting.value === 'true';
      case SettingType.JSON:    return JSON.parse(setting.value);
      case SettingType.ARRAY:   return JSON.parse(setting.value);
      default:                  return setting.value;
    }
  }

  private serializeValue(type: SettingType, value: any): string {
    switch (type) {
      case SettingType.NUMBER:  return String(Number(value));
      case SettingType.BOOLEAN: return String(Boolean(value));
      case SettingType.JSON:    return JSON.stringify(value);
      case SettingType.ARRAY:   return JSON.stringify(value);
      default:                  return String(value);
    }
  }

  private validateValue(setting: Setting, value: any): void {
    if (!setting.validation) return;
    const v = JSON.parse(setting.validation);
    if (v.min !== undefined && value < v.min) throw new Error(`Value must be at least ${v.min}`);
    if (v.max !== undefined && value > v.max) throw new Error(`Value must be at most ${v.max}`);
  }

  private async clearCache(key: string, category?: string): Promise<void> {
    if (!this.cacheManager) return;
    try {
      await this.cacheManager.del(CACHE_KEYS.SETTINGS.BY_KEY(key));
      if (category) await this.cacheManager.del(CACHE_KEYS.SETTINGS.BY_CATEGORY(category));
    } catch (e) {
      this.logger.warn(`Cache clear failed: ${e.message}`);
    }
  }

  // Explicit casts — old DB rows may have type=null so parseValue() returns raw strings
  private asNum(v: any): number { return parseFloat(String(v)); }
  private asBool(v: any): boolean { return v === true || String(v) === 'true'; }
}
