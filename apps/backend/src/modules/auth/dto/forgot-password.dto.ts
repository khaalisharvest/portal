import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: '03001234567', description: 'Phone number or email' })
  @IsString()
  @IsNotEmpty()
  identifier: string;
}
