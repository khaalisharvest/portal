import { Controller, Get, Body, UseGuards, Patch, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsNumber, IsBoolean, IsString, Min, Max, MaxLength, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { SettingsService } from './services/settings.service';
import { NoResponseWrapInterceptor } from '../../common/interceptors/no-response-wrap.interceptor';

// ─── DTOs ────────────────────────────────────────────────────────────────────

class SettingUpdateItem {
  @IsString() key: string;
  value: any;
}

export class BulkUpdateSettingsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SettingUpdateItem)
  updates: SettingUpdateItem[];
}

export class UpdateDeliverySettingsDto {
  @Type(() => Number) @IsNumber() @Min(0) deliveryFee: number;
  @Type(() => Number) @IsNumber() @Min(0) freeDeliveryThreshold: number;
  @Type(() => Boolean) @IsBoolean() isDeliveryEnabled: boolean;
}

export class UpdateNotificationBarSettingsDto {
  @Type(() => Boolean) @IsBoolean() isEnabled: boolean;
  @IsString() @MaxLength(1000) text: string;
  @IsString() backgroundColor: string;
  @IsString() textColor: string;
  @Type(() => Number) @IsNumber() @Min(10) speed: number;
}

export class UpdatePaymentSettingsDto {
  @IsString() bankName: string;
  @IsString() bankAccountName: string;
  @IsString() bankAccountNumber: string;
  @IsString() bankIban: string;
  @Type(() => Boolean) @IsBoolean() codEnabled: boolean;
}

export class UpdateContactSettingsDto {
  @IsString() adminEmail: string;
  @IsString() adminWhatsapp: string;
}

export class UpdateSocialSettingsDto {
  @IsString() @IsOptional() instagramUrl: string;
  @IsString() @IsOptional() facebookUrl: string;
  @IsString() @IsOptional() tiktokUrl: string;
}

export class UpdateStoreSettingsDto {
  @Type(() => Boolean) @IsBoolean() maintenanceMode: boolean;
}

export class UpdateOrderSettingsDto {
  @Type(() => Number) @IsNumber() @Min(0) @Max(100000) minOrderAmount: number;
}

// ─── Controller ──────────────────────────────────────────────────────────────

@ApiTags('Settings')
@Controller('settings')
@UseInterceptors(NoResponseWrapInterceptor)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // Generic bulk update — accepts any key/value pairs, validates via existing setting rules
  @Patch('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk update any settings (Super Admin)' })
  async bulkUpdate(@Body() dto: BulkUpdateSettingsDto) {
    await this.settingsService.bulkUpdate(dto.updates);
    return { message: 'Settings updated successfully' };
  }

  // All settings (read-only, admin)
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all settings (Admin)' })
  async getAllSettings() {
    return this.settingsService.getAllSettings();
  }

  // ─── Delivery ───────────────────────────────────────────────────────────────

  @Get('delivery')
  @ApiOperation({ summary: 'Get delivery settings (Public)' })
  async getDeliverySettings() {
    return this.settingsService.getDeliverySettings();
  }

  @Patch('delivery')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update delivery settings (Admin)' })
  async updateDeliverySettings(@Body() dto: UpdateDeliverySettingsDto) {
    await this.settingsService.updateDeliverySettings(dto);
    return { message: 'Delivery settings updated successfully' };
  }

  // ─── Notification bar ────────────────────────────────────────────────────────

  @Get('notification-bar')
  @ApiOperation({ summary: 'Get notification bar settings (Public)' })
  async getNotificationBarSettings() {
    return this.settingsService.getNotificationBarSettings();
  }

  @Patch('notification-bar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update notification bar settings (Admin)' })
  async updateNotificationBarSettings(@Body() dto: UpdateNotificationBarSettingsDto) {
    await this.settingsService.updateNotificationBarSettings(dto);
    return { message: 'Notification bar settings updated successfully' };
  }

  // ─── Payment ─────────────────────────────────────────────────────────────────

  @Get('payment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment settings (Admin)' })
  async getPaymentSettings() {
    return this.settingsService.getPaymentSettings();
  }

  @Patch('payment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update payment/bank settings (Admin)' })
  async updatePaymentSettings(@Body() dto: UpdatePaymentSettingsDto) {
    await this.settingsService.updatePaymentSettings(dto);
    return { message: 'Payment settings updated successfully' };
  }

  // ─── Contact ─────────────────────────────────────────────────────────────────

  @Get('contact')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get contact settings (Admin)' })
  async getContactSettings() {
    return this.settingsService.getContactSettings();
  }

  @Patch('contact')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update contact settings (Admin)' })
  async updateContactSettings(@Body() dto: UpdateContactSettingsDto) {
    await this.settingsService.updateContactSettings(dto);
    return { message: 'Contact settings updated successfully' };
  }

  // ─── Social ──────────────────────────────────────────────────────────────────

  @Get('social')
  @ApiOperation({ summary: 'Get social links (Public)' })
  async getSocialSettings() {
    return this.settingsService.getSocialSettings();
  }

  @Patch('social')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update social links (Admin)' })
  async updateSocialSettings(@Body() dto: UpdateSocialSettingsDto) {
    await this.settingsService.updateSocialSettings(dto);
    return { message: 'Social settings updated successfully' };
  }

  // ─── Store ───────────────────────────────────────────────────────────────────

  @Get('store')
  @ApiOperation({ summary: 'Get store settings (Public)' })
  async getStoreSettings() {
    return this.settingsService.getStoreSettings();
  }

  @Patch('store')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update store settings (Super Admin)' })
  async updateStoreSettings(@Body() dto: UpdateStoreSettingsDto) {
    await this.settingsService.updateStoreSettings(dto);
    return { message: 'Store settings updated successfully' };
  }

  // ─── Orders ──────────────────────────────────────────────────────────────────

  @Get('orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order settings (Admin)' })
  async getOrderSettings() {
    return this.settingsService.getOrderSettings();
  }

  @Patch('orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order settings (Admin)' })
  async updateOrderSettings(@Body() dto: UpdateOrderSettingsDto) {
    await this.settingsService.updateOrderSettings(dto);
    return { message: 'Order settings updated successfully' };
  }
}
