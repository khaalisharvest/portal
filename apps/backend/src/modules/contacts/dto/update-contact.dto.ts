import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsIn } from 'class-validator';

export class UpdateContactDto {
  @ApiProperty({ enum: ['pending', 'read', 'replied', 'archived'], required: false })
  @IsOptional()
  @IsIn(['pending', 'read', 'replied', 'archived'])
  status?: 'pending' | 'read' | 'replied' | 'archived';

  @ApiProperty({ description: 'Admin response to the contact message', required: false })
  @IsOptional()
  @IsString()
  adminResponse?: string;
}

