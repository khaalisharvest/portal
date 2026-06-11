import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { UserTypesService } from './user-types.service';
import { CreateUserTypeDto } from './dto/create-user-type.dto';

@ApiTags('User Types')
@Controller('super-admin/user-types')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
@ApiBearerAuth()
export class UserTypesController {
  constructor(private service: UserTypesService) {}

  @Get()
  @ApiOperation({ summary: 'List all user types' })
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a user type' })
  create(@Body() dto: CreateUserTypeDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user type by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a user type' })
  update(@Param('id') id: string, @Body() dto: CreateUserTypeDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user type' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
