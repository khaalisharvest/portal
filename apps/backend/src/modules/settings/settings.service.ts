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
}
