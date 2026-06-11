import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsPhoneNumber, MinLength, IsOptional, IsEmail } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { UsersService } from '../users/users.service';
import { ActivityService } from '../activity/activity.service';

class CreateStaffDto {
  @IsString() @IsNotEmpty() name: string;
  @IsPhoneNumber('PK') phone: string;
  @IsEmail() @IsOptional() email?: string;
  @IsString() @MinLength(6) password: string;
}

class UpdateStaffDto {
  @IsString() @IsNotEmpty() @IsOptional() name?: string;
  @IsString() @IsOptional() phone?: string;
  @IsEmail() @IsOptional() email?: string;
  @IsString() @MinLength(6) @IsOptional() password?: string;
}

@ApiTags('Staff Management')
@Controller('admin/staff')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
@ApiBearerAuth()
export class StaffController {
  constructor(
    private usersService: UsersService,
    private activityService: ActivityService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all staff members with activity summary' })
  async listStaff() {
    const staff = await this.usersService.findByRole('staff');
    const staffWithSummary = await Promise.all(
      staff.map(async (member) => {
        const summary = await this.activityService.getStaffSummary(member.id);
        const { password, ...memberData } = member as any;
        return { ...memberData, ...summary };
      }),
    );
    return staffWithSummary;
  }

  @Post()
  @ApiOperation({ summary: 'Create new staff member' })
  async createStaff(@Body() dto: CreateStaffDto) {
    const bcrypt = await import('bcryptjs');
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
      password: hashed,
      role: 'staff',
    });
    const { password, ...result } = user as any;
    return result;
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Activate or deactivate a staff member' })
  async updateStatus(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.usersService.updateUserStatus(id, body.isActive);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update staff member details' })
  async updateStaff(@Param('id') id: string, @Body() dto: UpdateStaffDto) {
    const updates: any = {};
    if (dto.name) updates.name = dto.name;
    if (dto.phone) updates.phone = dto.phone;
    if (dto.email !== undefined) updates.email = dto.email;
    if (dto.password) {
      const bcrypt = await import('bcryptjs');
      updates.password = await bcrypt.hash(dto.password, 10);
    }
    const user = await this.usersService.update(id, updates);
    const { password, ...result } = user as any;
    return result;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a staff member permanently' })
  async deleteStaff(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: 'Staff member deleted' };
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get all staff activity (most recent first)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAllActivity(@Query('page') page = 1, @Query('limit') limit = 30) {
    return this.activityService.getAll(Number(page), Number(limit));
  }

  @Get(':id/activity')
  @ApiOperation({ summary: 'Get activity for a specific staff member' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  async getStaffActivity(@Param('id') id: string, @Query('page') page = 1) {
    return this.activityService.getByStaff(id, Number(page), 30);
  }
}
