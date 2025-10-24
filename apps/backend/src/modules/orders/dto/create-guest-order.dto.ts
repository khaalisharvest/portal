import { IsString, IsNotEmpty, IsArray, ValidateNested, IsNumber, Min, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../entities/order.entity';

class GuestInfoDto {
  @ApiProperty({ example: 'John Doe', description: 'Guest full name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '+92 300 1234567', description: 'Guest phone number' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'john@example.com', description: 'Guest email address', required: false })
  @IsString()
  @IsOptional()
  email?: string;
}

class GuestAddressDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name for delivery' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '+92 300 1234567', description: 'Phone number for delivery' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '123 Main Street', description: 'Address line 1' })
  @IsString()
  @IsNotEmpty()
  addressLine1: string;

  @ApiProperty({ example: 'Apartment 4B', description: 'Address line 2', required: false })
  @IsString()
  @IsOptional()
  addressLine2?: string;

  @ApiProperty({ example: 'Lahore', description: 'City' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Punjab', description: 'State/Province (optional - defaults to Punjab)', required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ example: '54000', description: 'Postal code' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiProperty({ example: 'Pakistan', description: 'Country (optional - defaults to Pakistan)', required: false })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ example: 'home', description: 'Address type', enum: ['home', 'work', 'other'] })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ example: 'Leave at front door', description: 'Delivery instructions', required: false })
  @IsString()
  @IsOptional()
  instructions?: string;
}

class CreateGuestOrderItemDto {
  @ApiProperty({ example: 'uuid-of-product', description: 'ID of the product' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 2, description: 'Quantity of the product' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 'Large', description: 'Selected variant name', required: false })
  @IsString()
  @IsOptional()
  selectedVariant?: string;

  @ApiProperty({ example: 150, description: 'Price of the selected variant', required: false })
  @IsNumber()
  @IsOptional()
  variantPrice?: number;

  @ApiProperty({ example: 200, description: 'Original price of the selected variant', required: false })
  @IsNumber()
  @IsOptional()
  variantOriginalPrice?: number;
}

export class CreateGuestOrderDto {
  @ApiProperty({ type: GuestInfoDto, description: 'Guest contact information' })
  @ValidateNested()
  @Type(() => GuestInfoDto)
  guestInfo: GuestInfoDto;

  @ApiProperty({ type: GuestAddressDto, description: 'Delivery address' })
  @ValidateNested()
  @Type(() => GuestAddressDto)
  address: GuestAddressDto;

  @ApiProperty({ type: [CreateGuestOrderItemDto], description: 'List of items in the order' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGuestOrderItemDto)
  items: CreateGuestOrderItemDto[];

  @ApiProperty({ enum: PaymentMethod, example: 'cash_on_delivery', description: 'Payment method' })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @ApiProperty({ example: 'Please deliver after 5 PM', description: 'Additional notes for the order', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
