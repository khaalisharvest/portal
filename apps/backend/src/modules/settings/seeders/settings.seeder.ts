import { Injectable } from '@nestjs/common';
import { SettingsService } from '../services/settings.service';

@Injectable()
export class SettingsSeeder {
  constructor(private settingsService: SettingsService) {}

  async seed() {
    console.log('🌱 Seeding default settings...');
    
    try {
      await this.settingsService.initializeDefaultSettings();
      console.log('✅ Default settings seeded successfully');
    } catch (error) {
      console.error('❌ Error seeding settings:', error);
      throw error;
    }
  }
}
