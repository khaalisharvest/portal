import { IsString, IsNotEmpty, MinLength, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: '847291', description: '6-digit OTP sent via email or WhatsApp' })
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP must be 6 numeric digits' })
  otp: string;

  @ApiProperty({ example: '+923001234567', description: 'Phone or email used when requesting the OTP — scopes the OTP to this account' })
  @IsString()
  @IsNotEmpty({ message: 'Identifier is required' })
  identifier: string;

  @ApiProperty({ example: 'NewSecurePass1' })
  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  newPassword: string;
}
