import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, Min, IsObject, IsIn } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ description: 'Product name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Product description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Product price' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Product images', type: [String] })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({ description: 'Product category ID' })
  @IsString()
  categoryId: string;

  @ApiProperty({ description: 'Product type ID', required: false })
  @IsOptional()
  @IsString()
  productTypeId?: string;

  @ApiProperty({ description: 'Supplier ID', required: false })
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiProperty({ description: 'Admin ID who created this product' })
  @IsString()
  adminId: string;

  @ApiProperty({ description: 'Product specifications', type: 'object', required: false })
  @IsOptional()
  @IsObject()
  specifications?: Record<string, any>;

  @ApiProperty({ description: 'Nutrition or care information', type: 'object', required: false })
  @IsOptional()
  @IsObject()
  nutritionInfo?: Record<string, any>;

  @ApiProperty({ description: 'Is product fresh', required: false })
  @IsOptional()
  @IsBoolean()
  isFresh?: boolean;

  @ApiProperty({ description: 'Is product organic', required: false })
  @IsOptional()
  @IsBoolean()
  isOrganic?: boolean;

  @ApiProperty({ description: 'Is product available for sale', required: false })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiProperty({ description: 'Unit (kg, piece, liter, etc.)', required: false })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ description: 'Is product featured', required: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiProperty({ description: 'Product tags', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ description: 'Original price (for discount display)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  @ApiProperty({ description: 'Inventory type', required: false, enum: ['marketplace', 'warehouse'] })
  @IsOptional()
  @IsIn(['marketplace', 'warehouse'])
  inventoryType?: 'marketplace' | 'warehouse';

  @ApiProperty({ description: 'Stock quantity (warehouse only)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @ApiProperty({ description: 'Minimum stock level (warehouse only)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minStockLevel?: number;

  @ApiProperty({ description: 'Weight in kg', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiProperty({ description: 'Dimensions object', required: false, type: 'object' })
  @IsOptional()
  @IsObject()
  dimensions?: Record<string, any>;

  @ApiProperty({ description: 'Marketplace supplier name', required: false })
  @IsOptional()
  @IsString()
  marketplaceSupplier?: string;

  @ApiProperty({ description: 'Marketplace info', required: false, type: 'object' })
  @IsOptional()
  @IsObject()
  marketplaceInfo?: Record<string, any>;

  @ApiProperty({ description: 'SEO title', required: false })
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiProperty({ description: 'SEO description', required: false })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiProperty({ description: 'Status of the product', required: false, enum: ['draft', 'active', 'archived'] })
  @IsOptional()
  @IsIn(['draft', 'active', 'archived'])
  status?: 'draft' | 'active' | 'archived';

  // ===== VARIANT FIELDS =====
  @ApiProperty({ description: 'Whether this product has variants', required: false })
  @IsOptional()
  @IsBoolean()
  hasVariants?: boolean;

  @ApiProperty({ description: 'Variant name (e.g., "Size", "Quality", "Leaf Size")', required: false })
  @IsOptional()
  @IsString()
  variantName?: string;

  @ApiProperty({ description: 'Product variants with options', type: 'array', required: false })
  @IsOptional()
  @IsArray()
  variants?: Array<{
    name: string;
    price: number;
    originalPrice?: number;
    isAvailable?: boolean;
  }>;
}
