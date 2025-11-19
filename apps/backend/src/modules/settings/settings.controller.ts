import { Controller, Get, Post, Body, UseGuards, Patch, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IsNumber, IsBoolean, IsString, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SettingsService } from './services/settings.service';
import { NoResponseWrapInterceptor } from '../../common/interceptors/no-response-wrap.interceptor';

export class UpdateDeliverySettingsDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deliveryFee: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  freeDeliveryThreshold: number;

  @Type(() => Boolean)
  @IsBoolean()
  isDeliveryEnabled: boolean;
}

export class UpdateNotificationBarSettingsDto {
  @Type(() => Boolean)
  @IsBoolean()
  isEnabled: boolean;

  @IsString()
  @MaxLength(1000)
  text: string;

  @IsString()
  backgroundColor: string;

  @IsString()
  textColor: string;

  @Type(() => Number)
  @IsNumber()
  @Min(10)
  speed: number;
}


@ApiTags('Settings')
@Controller('settings')
@UseInterceptors(NoResponseWrapInterceptor)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('delivery')
  @ApiOperation({ summary: 'Get delivery settings (Public)' })
  @ApiResponse({ status: 200, description: 'Delivery settings retrieved successfully' })
  async getDeliverySettings() {
    return this.settingsService.getDeliverySettings();
  }

  @Patch('delivery')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update delivery settings (Admin)' })
  @ApiResponse({ status: 200, description: 'Delivery settings updated successfully' })
  async updateDeliverySettings(@Body() updateDeliverySettingsDto: UpdateDeliverySettingsDto) {
    await this.settingsService.updateDeliverySettings(updateDeliverySettingsDto);
    return { message: 'Delivery settings updated successfully' };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all settings (Admin)' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  async getAllSettings() {
    return this.settingsService.getAllSettings();
  }

  @Get('notification-bar')
  @ApiOperation({ summary: 'Get notification bar settings (Public)' })
  @ApiResponse({ status: 200, description: 'Notification bar settings retrieved successfully' })
  async getNotificationBarSettings() {
    return this.settingsService.getNotificationBarSettings();
  }

  @Patch('notification-bar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update notification bar settings (Admin)' })
  @ApiResponse({ status: 200, description: 'Notification bar settings updated successfully' })
  async updateNotificationBarSettings(@Body() updateNotificationBarSettingsDto: UpdateNotificationBarSettingsDto) {
    await this.settingsService.updateNotificationBarSettings(updateNotificationBarSettingsDto);
    return { message: 'Notification bar settings updated successfully' };
  }

}
