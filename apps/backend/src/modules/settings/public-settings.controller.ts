import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SettingsService } from './services/settings.service';

export class CalculateDeliveryFeeDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  orderAmount: number;
}

@ApiTags('Public Settings')
@Controller('public/settings')
export class PublicSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post('delivery/calculate')
  @ApiOperation({ summary: 'Calculate delivery fee for order amount (Public)' })
  @ApiResponse({ status: 200, description: 'Delivery fee calculated successfully' })
  async calculateDeliveryFee(@Body() body: CalculateDeliveryFeeDto) {
    const settings = await this.settingsService.getDeliverySettings();
    
    if (!settings.isDeliveryEnabled) {
      return { deliveryFee: 0, isFree: true, reason: 'Delivery is disabled' };
    }

    if (body.orderAmount >= settings.freeDeliveryThreshold) {
      return { 
        deliveryFee: 0, 
        isFree: true, 
        reason: `Your order qualifies for free delivery` 
      };
    }

    const amountNeeded = settings.freeDeliveryThreshold - body.orderAmount;
    return { 
      deliveryFee: settings.deliveryFee, 
      isFree: false, 
      reason: `Add ₨${amountNeeded.toFixed(2)} more to get free delivery (spend ₨${settings.freeDeliveryThreshold} or more)` 
    };
  }
}
