import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Inventory } from '../entities/inventory.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../../common/guards/roles.guard';

class SetInventoryDto {
  @ApiProperty() @IsNumber() @Min(0) quantity: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0) minimumStock?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() location?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() batchNumber?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() expiryDate?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() productId?: string;
}

@ApiTags('Inventory')
@Controller('products/:productId/inventory')
export class InventoryController {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'staff')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get inventory for a product (admin only)' })
  async get(@Param('productId') productId: string) {
    const inv = await this.inventoryRepository.findOne({ where: { productId } });
    return inv || { productId, quantity: 0, reservedQuantity: 0, availableQuantity: 0 };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'staff')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or update inventory for a product (admin)' })
  async upsert(@Param('productId') productId: string, @Body() dto: SetInventoryDto) {
    const existing = await this.inventoryRepository.findOne({ where: { productId } });

    if (existing) {
      const inv = await this.inventoryRepository.findOne({ where: { id: existing.id } });
      if (inv) {
        inv.quantity = dto.quantity;
        if (dto.minimumStock !== undefined) inv.minimumStock = dto.minimumStock;
        if (dto.location !== undefined) inv.location = dto.location;
        if (dto.batchNumber !== undefined) inv.batchNumber = dto.batchNumber;
        if (dto.expiryDate !== undefined) inv.expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : existing.expiryDate;
        // availableQuantity is computed by @AfterUpdate hook
        await this.inventoryRepository.save(inv);
      }
      return this.inventoryRepository.findOne({ where: { productId } });
    }

    const inv = this.inventoryRepository.create({
      productId,
      quantity: dto.quantity,
      reservedQuantity: 0,
      minimumStock: dto.minimumStock ?? 10,
      location: dto.location,
      batchNumber: dto.batchNumber,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
    });
    return this.inventoryRepository.save(inv);
  }
}
