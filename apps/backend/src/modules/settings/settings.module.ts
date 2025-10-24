import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsController } from './settings.controller';
import { PublicSettingsController } from './public-settings.controller';
import { SettingsService } from './services/settings.service';
import { SettingsSeeder } from './seeders/settings.seeder';
import { Setting } from './entities/setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Setting])],
  controllers: [SettingsController, PublicSettingsController],
  providers: [SettingsService, SettingsSeeder],
  exports: [SettingsService, SettingsSeeder],
})
export class SettingsModule {}
