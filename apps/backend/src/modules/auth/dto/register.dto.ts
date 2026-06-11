import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsOptional, MinLength, IsEnum, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '+923001234567' })
  @Matches(/^(\+92|0)[0-9]{10}$/, { message: 'Phone must be a valid Pakistani mobile number (e.g. 03001234567 or +923001234567)' })
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'john@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'Password1' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
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
