import { Injectable, NotFoundException, Inject, Optional, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { ProductType } from '../product-types/entities/product-type.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CACHE_KEYS } from '../../common/constants/cache-keys';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private readonly CACHE_TTL = 300000; // 5 minutes in milliseconds

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(ProductType)
    private productTypeRepository: Repository<ProductType>,
    @Optional() @Inject(CACHE_MANAGER) private cacheManager?: Cache,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto);
    const savedProduct = await this.productRepository.save(product);
    
    // Clear cache when new product is created (if cache available)
    await this.clearProductRelatedCaches();
    
    return savedProduct;
  }

  /**
   * Clear all product-related caches
   * Uses batch operation for better performance
   */
  private async clearProductRelatedCaches(): Promise<void> {
    if (!this.cacheManager) return;

    try {
      // Batch delete for better performance
      await Promise.all([
        this.cacheManager.del(CACHE_KEYS.PRODUCTS.CATEGORIES),
        this.cacheManager.del(CACHE_KEYS.PRODUCTS.PRODUCT_TYPES),
        this.cacheManager.del(CACHE_KEYS.PRODUCTS.FEATURED),
      ]);
    } catch (error) {
      // Log error but don't fail the operation
      this.logger.warn(`Failed to clear product caches: ${error.message}`);
    }
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
    const cacheKey = CACHE_KEYS.PRODUCTS.FEATURED;
    
    // Try to get from cache
    if (this.cacheManager) {
      try {
        const cached = await this.cacheManager.get<Product[]>(cacheKey);
        if (cached) {
          return cached;
        }
      } catch (error) {
        this.logger.warn(`Cache get failed for ${cacheKey}: ${error.message}`);
      }
    }

    // Fetch from database
    const products = await this.productRepository.find({
      where: { featured: true },
      relations: ['category', 'productType'],
      take: 8,
    });

    // Cache the result
    if (this.cacheManager) {
      try {
        await this.cacheManager.set(cacheKey, products, this.CACHE_TTL);
      } catch (error) {
        this.logger.warn(`Cache set failed for ${cacheKey}: ${error.message}`);
      }
    }
    
    return products;
  }

  async getCategories(): Promise<Category[]> {
    const cacheKey = CACHE_KEYS.PRODUCTS.CATEGORIES;
    
    // Try to get from cache
    if (this.cacheManager) {
      try {
        const cached = await this.cacheManager.get<Category[]>(cacheKey);
        if (cached) {
          return cached;
        }
      } catch (error) {
        this.logger.warn(`Cache get failed for ${cacheKey}: ${error.message}`);
      }
    }

    // Only return categories that have products
    const categories = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.productTypes', 'productType')
      .innerJoin('products', 'p', 'p.categoryId = category.id AND p.isAvailable = true')
      .where('category.active = :active', { active: true })
      .groupBy('category.id, productType.id')
      .orderBy('category.sortOrder', 'ASC')
      .addOrderBy('category.createdAt', 'DESC')
      .getMany();

    // Cache the result
    if (this.cacheManager) {
      try {
        await this.cacheManager.set(cacheKey, categories, this.CACHE_TTL);
      } catch (error) {
        this.logger.warn(`Cache set failed for ${cacheKey}: ${error.message}`);
      }
    }
    
    return categories;
  }

  async getProductTypes(): Promise<ProductType[]> {
    const cacheKey = CACHE_KEYS.PRODUCTS.PRODUCT_TYPES;
    
    // Try to get from cache
    if (this.cacheManager) {
      try {
        const cached = await this.cacheManager.get<ProductType[]>(cacheKey);
        if (cached) {
          return cached;
        }
      } catch (error) {
        this.logger.warn(`Cache get failed for ${cacheKey}: ${error.message}`);
      }
    }

    // Only return product types that have products
    const productTypes = await this.productTypeRepository
      .createQueryBuilder('productType')
      .leftJoinAndSelect('productType.category', 'category')
      .innerJoin('products', 'p', 'p.productTypeId = productType.id AND p.isAvailable = true')
      .where('productType.isActive = :isActive', { isActive: true })
      .groupBy('productType.id, category.id')
      .orderBy('productType.sortOrder', 'ASC')
      .addOrderBy('productType.createdAt', 'DESC')
      .getMany();

    // Cache the result
    if (this.cacheManager) {
      try {
        await this.cacheManager.set(cacheKey, productTypes, this.CACHE_TTL);
      } catch (error) {
        this.logger.warn(`Cache set failed for ${cacheKey}: ${error.message}`);
      }
    }
    
    return productTypes;
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
    const updatedProduct = await this.productRepository.save(product);
    
    // Clear cache when product is updated
    await this.clearProductRelatedCaches();
    
    return updatedProduct;
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
    
    // Clear cache when product is deleted
    await this.clearProductRelatedCaches();
  }

}
