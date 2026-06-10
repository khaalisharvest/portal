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
    const existing = await this.productTypeRepository.findOne({
      where: { displayName: createProductTypeDto.displayName }
    });
    if (existing) {
      throw new BadRequestException('A product type with this display name already exists');
    }
    const productType = this.productTypeRepository.create(createProductTypeDto);
    return this.productTypeRepository.save(productType);
  }

  async findAll(categoryId?: string, isActive?: boolean): Promise<ProductType[]> {
    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (isActive !== undefined) where.isActive = isActive;
    return this.productTypeRepository.find({
      where,
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
      relations: ['category'],
    });
  }

  async findOne(id: string): Promise<ProductType> {
    const productType = await this.productTypeRepository.findOne({ where: { id } });
    if (!productType) throw new NotFoundException('Product type not found');
    return productType;
  }

  async update(id: string, updateProductTypeDto: UpdateProductTypeDto): Promise<ProductType> {
    const productType = await this.findOne(id);
    if (updateProductTypeDto.displayName && updateProductTypeDto.displayName !== productType.displayName) {
      const existing = await this.productTypeRepository.findOne({
        where: { displayName: updateProductTypeDto.displayName }
      });
      if (existing) {
        throw new BadRequestException('A product type with this display name already exists');
      }
    }
    Object.assign(productType, updateProductTypeDto);
    return this.productTypeRepository.save(productType);
  }

  async remove(id: string): Promise<void> {
    const productType = await this.productTypeRepository.findOne({
      where: { id },
      relations: ['products']
    });
    if (!productType) throw new NotFoundException('Product type not found');
    if (productType.products?.length > 0) {
      throw new BadRequestException('Cannot delete product type that has products');
    }
    await this.productTypeRepository.remove(productType);
  }
}
