import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SettingsService } from './services/settings.service';

class CalculateDeliveryFeeDto {
  @Type(() => Number) @IsNumber() @Min(0) orderAmount: number;
}

@ApiTags('Public Settings')
@Controller('public/settings')
export class PublicSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all public settings — bank details, contact, social, store status (No auth)' })
  async getPublicSettings() {
    return this.settingsService.getPublicSettings();
  }

  @Post('delivery/calculate')
  @ApiOperation({ summary: 'Calculate delivery fee for a given order amount (No auth)' })
  async calculateDeliveryFee(@Body() body: CalculateDeliveryFeeDto) {
    const settings = await this.settingsService.getDeliverySettings();

    if (!settings.isDeliveryEnabled) {
      return { deliveryFee: 0, isFree: true, reason: 'Delivery is currently disabled' };
    }

    if (body.orderAmount >= settings.freeDeliveryThreshold) {
      return { deliveryFee: 0, isFree: true, reason: 'Your order qualifies for free delivery' };
    }

    const amountNeeded = settings.freeDeliveryThreshold - body.orderAmount;
    return {
      deliveryFee: settings.deliveryFee,
      isFree: false,
      reason: `Add ₨${amountNeeded.toFixed(0)} more to get free delivery`,
    };
  }
}
