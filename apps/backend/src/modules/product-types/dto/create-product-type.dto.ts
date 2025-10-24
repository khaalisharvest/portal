import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, IsObject } from 'class-validator';

export class CreateProductTypeDto {
  @ApiProperty()
  @IsString()
  categoryId: string;
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  displayName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  specifications?: {
    fields: Array<{
      id: string;
      name: string;
      label: string;
      type: 'text' | 'number' | 'email' | 'url' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'date' | 'time' | 'datetime' | 'color' | 'range' | 'file';
      required: boolean;
      placeholder?: string;
      description?: string;
      options?: Array<{ label: string; value: string }>;
      min?: number;
      max?: number;
      step?: number;
      rows?: number;
      accept?: string;
      validation?: {
        pattern?: string;
        message?: string;
      };
      category?: string;
    }>;
  };

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  pricing?: {
    primaryMethod: 'weight' | 'volume' | 'quantity' | 'size';
    hasWeight: boolean;
    hasVolume: boolean;
    hasQuantity: boolean;
    hasSize: boolean;
    units: string[];
  };

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  requirements?: {
    needsImages: boolean;
    needsCertification: boolean;
    needsLocation: boolean;
    needsExpiryDate: boolean;
    needsBatchNumber: boolean;
    minImages: number;
    maxImages: number;
  };

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedUserTypes?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  color?: string;
}
