import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductType } from './entities/product-type.entity';
import { CreateProductTypeDto } from './dto/create-product-type.dto';
import { UpdateProductTypeDto } from './dto/update-product-type.dto';

@Injectable()
export class ProductTypesService {
  constructor(
    @InjectRepository(ProductType)
    private productTypeRepository: Repository<ProductType>,
  ) {}

  async create(createProductTypeDto: CreateProductTypeDto): Promise<ProductType> {
    // Check if product type with same name already exists
    const existingProductType = await this.productTypeRepository.findOne({
      where: { name: createProductTypeDto.name }
    });
    
    if (existingProductType) {
      throw new BadRequestException('Product type with this name already exists');
    }

    // Validate specifications fields if provided
    if (createProductTypeDto.specifications?.fields) {
      this.validateSpecificationFields(createProductTypeDto.specifications.fields);
    }

    const productType = this.productTypeRepository.create(createProductTypeDto);
    return this.productTypeRepository.save(productType);
  }

  async findAll(categoryId?: string, isActive?: boolean): Promise<ProductType[]> {
    const where: any = {};
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.productTypeRepository.find({
      where,
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
      relations: ['category'],
    });
  }

  async findOne(id: string): Promise<ProductType> {
    const productType = await this.productTypeRepository.findOne({ where: { id } });
    if (!productType) {
      throw new NotFoundException('Product type not found');
    }
    return productType;
  }

  async update(id: string, updateProductTypeDto: UpdateProductTypeDto): Promise<ProductType> {
    const productType = await this.findOne(id);
    
    // Check if name is being updated and if it conflicts with existing product type
    if (updateProductTypeDto.name && updateProductTypeDto.name !== productType.name) {
      const existingProductType = await this.productTypeRepository.findOne({
        where: { name: updateProductTypeDto.name }
      });
      
      if (existingProductType) {
        throw new BadRequestException('Product type with this name already exists');
      }
    }

    // Validate specifications fields if provided
    if (updateProductTypeDto.specifications?.fields) {
      this.validateSpecificationFields(updateProductTypeDto.specifications.fields);
    }

    Object.assign(productType, updateProductTypeDto);
    return this.productTypeRepository.save(productType);
  }

  async remove(id: string): Promise<void> {
    const productType = await this.productTypeRepository.findOne({ 
      where: { id },
      relations: ['products']
    });
    
    if (!productType) {
      throw new NotFoundException('Product type not found');
    }

    if (productType.products && productType.products.length > 0) {
      throw new BadRequestException('Cannot delete product type with existing products');
    }

    await this.productTypeRepository.remove(productType);
  }

  private validateSpecificationFields(fields: any[]): void {
    if (!Array.isArray(fields)) {
      throw new BadRequestException('Specifications fields must be an array');
    }

    const fieldNames = new Set<string>();
    const fieldIds = new Set<string>();

    for (const field of fields) {
      // Validate required fields
      if (!field.id || !field.name || !field.label || !field.type) {
        throw new BadRequestException('Each field must have id, name, label, and type');
      }

      // Check for duplicate field names
      if (fieldNames.has(field.name)) {
        throw new BadRequestException(`Duplicate field name: ${field.name}`);
      }
      fieldNames.add(field.name);

      // Check for duplicate field IDs
      if (fieldIds.has(field.id)) {
        throw new BadRequestException(`Duplicate field ID: ${field.id}`);
      }
      fieldIds.add(field.id);

      // Validate field type
      const validTypes = ['text', 'number', 'email', 'url', 'textarea', 'select', 'multiselect', 'checkbox', 'radio', 'date', 'time', 'datetime', 'color', 'range', 'file'];
      if (!validTypes.includes(field.type)) {
        throw new BadRequestException(`Invalid field type: ${field.type}`);
      }

      // Validate options for select/multiselect/radio fields
      if (['select', 'multiselect', 'radio'].includes(field.type)) {
        if (!field.options || !Array.isArray(field.options) || field.options.length === 0) {
          throw new BadRequestException(`Field ${field.name} of type ${field.type} must have options`);
        }
      }

      // Validate numeric constraints for number fields
      if (field.type === 'number') {
        if (field.min !== undefined && field.max !== undefined && field.min > field.max) {
          throw new BadRequestException(`Field ${field.name}: min value cannot be greater than max value`);
        }
      }
    }
  }
}
