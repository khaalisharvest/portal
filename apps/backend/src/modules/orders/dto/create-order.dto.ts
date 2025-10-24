import { IsString, IsEnum, IsOptional, IsArray, ValidateNested, IsUUID, IsNumber, IsDecimal } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../entities/order.entity';

export class CreateOrderItemDto {
  @IsString()
  @IsUUID()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsString()
  @IsOptional()
  selectedVariant?: string; // The variant name that was selected

  @IsNumber()
  @IsOptional()
  variantPrice?: number; // The price of the selected variant

  @IsNumber()
  @IsOptional()
  variantOriginalPrice?: number; // The original price of the selected variant
}

export class CreateOrderDto {
  @IsString()
  @IsUUID()
  addressId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsString()
  @IsOptional()
  notes?: string;
}
