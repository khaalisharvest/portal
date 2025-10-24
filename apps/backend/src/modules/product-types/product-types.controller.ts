import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProductTypesService } from './product-types.service';
import { CreateProductTypeDto } from './dto/create-product-type.dto';
import { UpdateProductTypeDto } from './dto/update-product-type.dto';

@ApiTags('Product Types')
@Controller('product-types')
export class ProductTypesController {
  constructor(private readonly productTypesService: ProductTypesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product type' })
  @ApiResponse({ status: 201, description: 'Product type created successfully' })
  async create(@Body() createProductTypeDto: CreateProductTypeDto) {
    return this.productTypesService.create(createProductTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all product types' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status' })
  @ApiResponse({ status: 200, description: 'Product types retrieved successfully' })
  async findAll(@Query('categoryId') categoryId?: string, @Query('isActive') isActive?: boolean) {
    return this.productTypesService.findAll(categoryId, isActive);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product type by ID' })
  @ApiResponse({ status: 200, description: 'Product type retrieved successfully' })
  async findOne(@Param('id') id: string) {
    return this.productTypesService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product type' })
  @ApiResponse({ status: 200, description: 'Product type updated successfully' })
  async update(@Param('id') id: string, @Body() updateProductTypeDto: UpdateProductTypeDto) {
    return this.productTypesService.update(id, updateProductTypeDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete product type' })
  @ApiResponse({ status: 200, description: 'Product type deleted successfully' })
  async remove(@Param('id') id: string) {
    return this.productTypesService.remove(id);
  }
}
