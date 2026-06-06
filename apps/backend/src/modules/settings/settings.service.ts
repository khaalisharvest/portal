import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './settings.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private settingsRepository: Repository<Setting>,
  ) {}

  async getSetting(key: string): Promise<string | null> {
    const setting = await this.settingsRepository.findOne({
      where: { key }
    });
    return setting ? setting.value : null;
  }

  async setSetting(key: string, value: string, description?: string, category: string = 'system'): Promise<Setting> {
    let setting = await this.settingsRepository.findOne({
      where: { key }
    });

    if (setting) {
      setting.value = value;
      setting.description = description || setting.description;
      setting.category = category;
    } else {
      setting = this.settingsRepository.create({
        key,
        value,
        description,
        category
      });
    }

    return this.settingsRepository.save(setting);
  }

  async getDeliverySettings(): Promise<{
    deliveryFee: number;
    freeDeliveryThreshold: number;
    isDeliveryEnabled: boolean;
  }> {
    const deliveryFee = await this.getSetting('delivery_fee');
    const freeDeliveryThreshold = await this.getSetting('free_delivery_threshold');
    const isDeliveryEnabled = await this.getSetting('delivery_enabled');

    return {
      deliveryFee: deliveryFee ? parseFloat(deliveryFee) : 0,
      freeDeliveryThreshold: freeDeliveryThreshold ? parseFloat(freeDeliveryThreshold) : 0,
      isDeliveryEnabled: isDeliveryEnabled === 'true'
    };
  }

  async updateDeliverySettings(settings: {
    deliveryFee: number;
    freeDeliveryThreshold: number;
    isDeliveryEnabled: boolean;
  }): Promise<void> {
    await this.setSetting('delivery_fee', settings.deliveryFee.toString(), 'Delivery fee in PKR', 'delivery');
    await this.setSetting('free_delivery_threshold', settings.freeDeliveryThreshold.toString(), 'Minimum order amount for free delivery in PKR', 'delivery');
    await this.setSetting('delivery_enabled', settings.isDeliveryEnabled.toString(), 'Enable/disable delivery service', 'delivery');
  }

  async getAllSettings(): Promise<Setting[]> {
    return this.settingsRepository.find({
      order: { category: 'ASC', key: 'ASC' }
    });
  }

  async getSettingsByCategory(category: string): Promise<Setting[]> {
    return this.settingsRepository.find({
      where: { category },
      order: { key: 'ASC' }
    });
  }

  async initializeDefaultSettings(): Promise<void> {
    const defaults = [
      { key: 'delivery_fee', value: '150', description: 'Delivery fee in PKR', category: 'delivery' },
      { key: 'free_delivery_threshold', value: '2000', description: 'Minimum order amount for free delivery in PKR', category: 'delivery' },
      { key: 'delivery_enabled', value: 'true', description: 'Enable/disable delivery service', category: 'delivery' },
      { key: 'notification_bar_text', value: 'Free delivery on orders above PKR 2,000!', description: 'Notification bar message', category: 'app' },
      { key: 'notification_bar_enabled', value: 'true', description: 'Show/hide notification bar', category: 'app' },
    ];

    for (const item of defaults) {
      const existing = await this.getSetting(item.key);
      if (!existing) {
        await this.setSetting(item.key, item.value, item.description, item.category);
      }
    }
  }
}
