import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsPhoneNumber, IsEmail, IsOptional, MinLength, IsEnum } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '+923001234567' })
  @IsPhoneNumber('PK')
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'john@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'customer',
    enum: ['customer'],
    description: 'User role: only customer registration is allowed via this endpoint. Other roles are admin-managed.'
  })
  @IsEnum(['customer'])
  @IsOptional()
  role?: 'customer' = 'customer';
}
