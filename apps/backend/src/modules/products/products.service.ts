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
import { ActivityService } from '../activity/activity.service';
import { CloudinaryService } from './services/cloudinary.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private readonly CACHE_TTL = 300000;

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(ProductType)
    private productTypeRepository: Repository<ProductType>,
    private cloudinaryService: CloudinaryService,
    @Optional() @Inject(CACHE_MANAGER) private cacheManager?: Cache,
    @Optional() private activityService?: ActivityService,
  ) {}

  async create(createProductDto: CreateProductDto, adminId: string, performedBy?: { id: string; name: string }): Promise<Product> {
    const product = this.productRepository.create({ ...createProductDto, adminId });
    const savedProduct = await this.productRepository.save(product);
    await this.clearProductRelatedCaches();

    if (performedBy && this.activityService) {
      setImmediate(() => {
        this.activityService.log({
          staffId: performedBy.id,
          staffName: performedBy.name,
          action: 'product_created',
          entityType: 'product',
          entityId: savedProduct.id,
          entityLabel: savedProduct.name,
        }).catch(() => {});
      });
    }

    return savedProduct;
  }

  private async clearProductRelatedCaches(): Promise<void> {
    if (!this.cacheManager) return;
    try {
      await Promise.all([
        this.cacheManager.del(CACHE_KEYS.PRODUCTS.CATEGORIES),
        this.cacheManager.del(CACHE_KEYS.PRODUCTS.PRODUCT_TYPES),
        this.cacheManager.del(CACHE_KEYS.PRODUCTS.FEATURED),
      ]);
    } catch (error) {
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
    includeAll?: boolean;
    status?: string;
  }): Promise<{ products: Product[]; total: number; page: number; limit: number; totalPages: number; categories: Category[]; productTypes: ProductType[] }> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit && filters.limit > 0 ? filters.limit : 12;
      const skip = (page - 1) * limit;

      const baseQuery = this.productRepository.createQueryBuilder('product')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.productType', 'productType')
        .leftJoinAndSelect('product.inventory', 'inventory', 'inventory.isActive = :active', { active: true });

      const conditions: string[] = [];
      const params: Record<string, any> = {};

      if (!filters.includeAll) {
        conditions.push('product.isAvailable = :isAvailable');
        params.isAvailable = true;
      }
      if (filters.category) {
        const categoryIds = filters.category.split(',').map(id => id.trim());
        conditions.push('product.categoryId IN (:...categoryIds)');
        params.categoryIds = categoryIds;
      }
      if (filters.featured !== undefined) {
        conditions.push('product.featured = :featured');
        params.featured = filters.featured;
      }
      if (filters.type) {
        const typeIds = filters.type.split(',').map(id => id.trim());
        conditions.push('product.productTypeId IN (:...typeIds)');
        params.typeIds = typeIds;
      }
      if (filters.search) {
        conditions.push('(product.name ILIKE :search OR product.description ILIKE :search OR product.tags::text ILIKE :search)');
        params.search = `%${filters.search}%`;
      }
      if (filters.status) {
        conditions.push('product.status = :status');
        params.status = filters.status;
      }

      if (conditions.length > 0) {
        baseQuery.where(conditions.join(' AND '), params);
      }

      const total = await baseQuery.getCount();
      const products = await baseQuery
        .orderBy('product.createdAt', 'DESC')
        .skip(skip)
        .take(limit)
        .getMany();

      const totalPages = Math.ceil(total / limit);
      const categories = await this.getCategories();
      const productTypes = await this.getProductTypes();

      return { products, total, page, limit, totalPages, categories, productTypes };
    } catch (error) {
      throw error;
    }
  }

  async getFeatured(): Promise<Product[]> {
    const cacheKey = CACHE_KEYS.PRODUCTS.FEATURED;
    if (this.cacheManager) {
      try {
        const cached = await this.cacheManager.get<Product[]>(cacheKey);
        if (cached) return cached;
      } catch (error) {
        this.logger.warn(`Cache get failed for ${cacheKey}: ${error.message}`);
      }
    }

    const products = await this.productRepository.find({
      where: { featured: true, isAvailable: true, status: 'active' },
      relations: ['category', 'productType'],
      take: 8,
    });

    if (this.cacheManager) {
      try { await this.cacheManager.set(cacheKey, products, this.CACHE_TTL); } catch {}
    }
    return products;
  }

  async getCategories(): Promise<Category[]> {
    const cacheKey = CACHE_KEYS.PRODUCTS.CATEGORIES;
    if (this.cacheManager) {
      try {
        const cached = await this.cacheManager.get<Category[]>(cacheKey);
        if (cached) return cached;
      } catch (error) {
        this.logger.warn(`Cache get failed for ${cacheKey}: ${error.message}`);
      }
    }

    const categories = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.productTypes', 'productType')
      .innerJoin('products', 'p', 'p.categoryId = category.id AND p.isAvailable = true')
      .where('category.active = :active', { active: true })
      .groupBy('category.id, productType.id')
      .orderBy('category.sortOrder', 'ASC')
      .addOrderBy('category.createdAt', 'DESC')
      .getMany();

    if (this.cacheManager) {
      try { await this.cacheManager.set(cacheKey, categories, this.CACHE_TTL); } catch {}
    }
    return categories;
  }

  async getProductTypes(): Promise<ProductType[]> {
    const cacheKey = CACHE_KEYS.PRODUCTS.PRODUCT_TYPES;
    if (this.cacheManager) {
      try {
        const cached = await this.cacheManager.get<ProductType[]>(cacheKey);
        if (cached) return cached;
      } catch (error) {
        this.logger.warn(`Cache get failed for ${cacheKey}: ${error.message}`);
      }
    }

    const productTypes = await this.productTypeRepository
      .createQueryBuilder('productType')
      .leftJoinAndSelect('productType.category', 'category')
      .innerJoin('products', 'p', 'p.productTypeId = productType.id AND p.isAvailable = true')
      .where('productType.isActive = :isActive', { isActive: true })
      .groupBy('productType.id, category.id')
      .orderBy('productType.sortOrder', 'ASC')
      .addOrderBy('productType.createdAt', 'DESC')
      .getMany();

    if (this.cacheManager) {
      try { await this.cacheManager.set(cacheKey, productTypes, this.CACHE_TTL); } catch {}
    }
    return productTypes;
  }

  async getCategoriesWithTypes(): Promise<Category[]> {
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
    if (!product) throw new NotFoundException(`Product with ID ${id} not found`);
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto, performedBy?: { id: string; name: string }): Promise<Product> {
    const product = await this.findOne(id);

    // Delete Cloudinary images that were removed in this update
    if (updateProductDto.images && product.images) {
      const removed = this.cloudinaryService.getRemovedUrls(product.images, updateProductDto.images);
      if (removed.length) {
        setImmediate(() => this.cloudinaryService.deleteImages(removed));
      }
    }

    Object.assign(product, updateProductDto);
    const updatedProduct = await this.productRepository.save(product);
    await this.clearProductRelatedCaches();

    if (performedBy && this.activityService) {
      setImmediate(() => {
        this.activityService.log({
          staffId: performedBy.id,
          staffName: performedBy.name,
          action: 'product_updated',
          entityType: 'product',
          entityId: updatedProduct.id,
          entityLabel: updatedProduct.name,
        }).catch(() => {});
      });
    }

    return updatedProduct;
  }

  async remove(id: string, performedBy?: { id: string; name: string }): Promise<void> {
    const product = await this.findOne(id);
    const productName = product.name;
    const productId = product.id;
    const images = [...(product.images || [])];

    await this.productRepository.remove(product);

    // Delete all Cloudinary images after successful DB deletion
    if (images.length) {
      setImmediate(() => this.cloudinaryService.deleteImages(images));
    }

    await this.clearProductRelatedCaches();

    if (performedBy && this.activityService) {
      setImmediate(() => {
        this.activityService.log({
          staffId: performedBy.id,
          staffName: performedBy.name,
          action: 'product_deleted',
          entityType: 'product',
          entityId: productId,
          entityLabel: productName,
        }).catch(() => {});
      });
    }
  }
}
