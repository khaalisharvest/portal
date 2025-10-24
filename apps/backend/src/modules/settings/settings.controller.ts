import { Controller, Get, Post, Body, UseGuards, Patch, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IsNumber, IsBoolean, Min } from 'class-validator';
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

}
