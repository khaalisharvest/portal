import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches, IsEmail, IsOptional, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @Matches(/^(\+92|0)[0-9]{10}$/, { message: 'Phone must be a valid Pakistani mobile number (e.g. 03001234567 or +923001234567)' })
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
