import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { ProductType } from '../product-types/entities/product-type.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(ProductType)
    private productTypeRepository: Repository<ProductType>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto);
    return this.productRepository.save(product);
  }

  async findAll(filters: {
    category?: string;
    featured?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<{ products: Product[]; total: number; page: number; limit: number; totalPages: number; categories: Category[]; productTypes: ProductType[] }> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit && filters.limit > 0 ? filters.limit : 12;
      const skip = (page - 1) * limit;
      

      // Build base query
      const baseQuery = this.productRepository.createQueryBuilder('product')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.productType', 'productType')
        .where('product.isAvailable = :isAvailable', { isAvailable: true });

      // Apply filters
      if (filters.category) {
        const categoryIds = filters.category.split(',').map(id => id.trim());
        baseQuery.andWhere('product.categoryId IN (:...categoryIds)', { categoryIds });
      }

      if (filters.featured !== undefined) {
        baseQuery.andWhere('product.featured = :featured', { featured: filters.featured });
      }

      if (filters.type) {
        const typeIds = filters.type.split(',').map(id => id.trim());
        baseQuery.andWhere('product.productTypeId IN (:...typeIds)', { typeIds });
      }

      if (filters.search) {
        baseQuery.andWhere(
          '(product.name ILIKE :search OR product.description ILIKE :search OR product.tags::text ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      // Get total count
      const total = await baseQuery.getCount();

      // Get paginated results
      const products = await baseQuery
        .orderBy('product.createdAt', 'DESC')
        .skip(skip)
        .take(limit)
        .getMany();

      const totalPages = Math.ceil(total / limit);

      // Get categories and product types that have products
      const categories = await this.getCategories();
      const productTypes = await this.getProductTypes();

      return {
        products,
        total,
        page,
        limit,
        totalPages,
        categories,
        productTypes,
      };
    } catch (error) {
      throw error;
    }
  }

  async getFeatured(): Promise<Product[]> {
    return this.productRepository.find({
      where: { featured: true },
      relations: ['category', 'productType'],
      take: 8,
    });
  }

  async getCategories(): Promise<Category[]> {
    // Only return categories that have products
    return this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.productTypes', 'productType')
      .innerJoin('products', 'p', 'p.categoryId = category.id AND p.isAvailable = true')
      .where('category.active = :active', { active: true })
      .groupBy('category.id, productType.id')
      .orderBy('category.sortOrder', 'ASC')
      .addOrderBy('category.createdAt', 'DESC')
      .getMany();
  }

  async getProductTypes(): Promise<ProductType[]> {
    // Only return product types that have products
    return this.productTypeRepository
      .createQueryBuilder('productType')
      .leftJoinAndSelect('productType.category', 'category')
      .innerJoin('products', 'p', 'p.productTypeId = productType.id AND p.isAvailable = true')
      .where('productType.isActive = :isActive', { isActive: true })
      .groupBy('productType.id, category.id')
      .orderBy('productType.sortOrder', 'ASC')
      .addOrderBy('productType.createdAt', 'DESC')
      .getMany();
  }

  async getCategoriesWithTypes(): Promise<Category[]> {
    // Return all active categories with their active product types for admin forms
    return this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.productTypes', 'productType', 'productType.isActive = :isActive', { isActive: true })
      .where('category.active = :active', { active: true })
      .orderBy('category.sortOrder', 'ASC')
      .addOrderBy('productType.sortOrder', 'ASC')
      .getMany();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'productType'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

}
