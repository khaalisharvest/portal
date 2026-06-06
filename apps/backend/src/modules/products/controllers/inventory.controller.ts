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
}

@ApiTags('Inventory')
@Controller('products/:productId/inventory')
export class InventoryController {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get inventory for a product' })
  async get(@Param('productId') productId: string) {
    const inv = await this.inventoryRepository.findOne({ where: { productId } });
    return inv || { productId, quantity: 0, reservedQuantity: 0, availableQuantity: 0 };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or update inventory for a product (admin)' })
  async upsert(@Param('productId') productId: string, @Body() dto: SetInventoryDto) {
    const existing = await this.inventoryRepository.findOne({ where: { productId } });

    if (existing) {
      await this.inventoryRepository.update(existing.id, {
        quantity: dto.quantity,
        minimumStock: dto.minimumStock ?? existing.minimumStock,
        location: dto.location ?? existing.location,
        batchNumber: dto.batchNumber ?? existing.batchNumber,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : existing.expiryDate,
      });
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
