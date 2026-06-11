import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, IsObject } from 'class-validator';

export class CreateUserTypeDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsString() @IsNotEmpty()
  displayName: string;

  @IsString() @IsOptional()
  description?: string;

  @IsObject() @IsOptional()
  permissions?: Record<string, boolean>;

  @IsObject() @IsOptional()
  features?: Record<string, boolean>;

  @IsObject() @IsOptional()
  onboardingSteps?: Record<string, string>;

  @IsBoolean() @IsOptional()
  isActive?: boolean;

  @IsInt() @IsOptional()
  sortOrder?: number;

  @IsString() @IsOptional()
  icon?: string;

  @IsString() @IsOptional()
  color?: string;
}
