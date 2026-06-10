import { Controller, Get, Post, Body, Patch, Put, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'staff')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product' })
  create(@Request() req, @Body() createProductDto: CreateProductDto) {
    const adminId = req.user.id || req.user.sub;
    return this.productsService.create(createProductDto, adminId, { id: adminId, name: req.user.name || req.user.email });
  }

  // Admin-only: returns ALL products regardless of isAvailable
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'staff')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: get all products (including unavailable)' })
  async findAllAdmin(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.productsService.findAll({
      category, search, status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      type,
      includeAll: true,
    });
  }

  // Public: only isAvailable products
  @Get()
  @ApiOperation({ summary: 'Get all products with filters' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'featured', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'type', required: false })
  async findAll(
    @Query('category') category?: string,
    @Query('featured') featured?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ) {
    return this.productsService.findAll({
      category,
      featured: featured !== undefined ? featured === 'true' : undefined,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 12,
      type,
    });
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  getCategories() {
    return this.productsService.getCategories();
  }

  @Get('categories-with-types')
  @ApiOperation({ summary: 'Get all categories with their product types' })
  getCategoriesWithTypes() {
    return this.productsService.getCategoriesWithTypes();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'staff')
  @ApiBearerAuth()
  update(@Request() req, @Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto, { id: req.user.id, name: req.user.name || req.user.email });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'staff')
  @ApiBearerAuth()
  putUpdate(@Request() req, @Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto, { id: req.user.id, name: req.user.name || req.user.email });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'staff')
  @ApiBearerAuth()
  remove(@Request() req, @Param('id') id: string) {
    return this.productsService.remove(id, { id: req.user.id, name: req.user.name || req.user.email });
  }
}
