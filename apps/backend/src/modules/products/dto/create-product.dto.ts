import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, Min, IsObject, IsIn, IsNotEmpty, MaxLength } from 'class-validator';
import { PRODUCT_UNITS } from '../../../common/constants/units';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ required: false, default: '' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  productTypeId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  specifications?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isOrganic?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiProperty({ enum: PRODUCT_UNITS })
  @IsIn([...PRODUCT_UNITS])
  unit: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  @ApiProperty({ required: false, enum: ['marketplace', 'warehouse'] })
  @IsOptional()
  @IsIn(['marketplace', 'warehouse'])
  inventoryType?: 'marketplace' | 'warehouse';

  @ApiProperty({ required: false, enum: ['draft', 'active', 'archived'] })
  @IsOptional()
  @IsIn(['draft', 'active', 'archived'])
  status?: 'draft' | 'active' | 'archived';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  marketplaceInfo?: { supplierName?: string; supplierContact?: string };

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hasVariants?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  variantName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  variants?: Array<{ name: string; price: number; originalPrice?: number; isAvailable?: boolean }>;

  // ── Food Labeling (PFA compliance) ────────────────────────────────────
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ingredients?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  nutritionalInfo?: Record<string, string>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  expiryInfo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cprNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  allergens?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  manufacturerInfo?: string;
}
