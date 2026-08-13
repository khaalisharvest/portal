import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from '../entities/wishlist.entity';
import { Product } from '../entities/product.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private wishlistRepository: Repository<Wishlist>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async toggle(userId: string, productId: string): Promise<{ added: boolean }> {
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const existing = await this.wishlistRepository.findOne({ where: { userId, productId } });

    if (existing) {
      await this.wishlistRepository.remove(existing);
      return { added: false };
    }

    // Use entity-based save so TypeORM handles column name mapping correctly
    const entry = this.wishlistRepository.create({ userId, productId, isActive: true });
    await this.wishlistRepository.save(entry);
    return { added: true };
  }

  async findByUser(userId: string): Promise<Wishlist[]> {
    return this.wishlistRepository.find({
      where: { userId, isActive: true },
      relations: ['product', 'product.category'],
      order: { createdAt: 'DESC' },
    });
  }

  async isWishlisted(userId: string, productId: string): Promise<boolean> {
    const entry = await this.wishlistRepository.findOne({ where: { userId, productId } });
    return !!entry;
  }

  async getPopularProducts(): Promise<{
    product: Product;
    wishlistCount: number;
    savedBy: { id: string; name: string; phone: string; savedAt: Date }[];
  }[]> {
    // Single query: products with their savers, ordered by save count desc
    const entries = await this.wishlistRepository
      .createQueryBuilder('w')
      .innerJoinAndSelect('w.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .innerJoinAndSelect('w.user', 'user')
      .orderBy('w.createdAt', 'DESC')
      .limit(500) // cap raw rows; aggregation happens in JS
      .getRawAndEntities();

    // Group by productId in memory
    const map = new Map<string, {
      product: Product;
      wishlistCount: number;
      savedBy: { id: string; name: string; phone: string; savedAt: Date }[];
    }>();

    for (const w of entries.entities) {
      if (!w.product) continue;
      const pid = w.productId;
      if (!map.has(pid)) {
        map.set(pid, { product: w.product, wishlistCount: 0, savedBy: [] });
      }
      const entry = map.get(pid)!;
      entry.wishlistCount++;
      if (w.user) {
        entry.savedBy.push({
          id: w.userId,
          name: (w.user as any).name ?? 'Unknown',
          phone: (w.user as any).phone ?? '',
          savedAt: w.createdAt,
        });
      }
    }

    return [...map.values()].sort((a, b) => b.wishlistCount - a.wishlistCount);
  }

  async getTotalCount(): Promise<number> {
    return this.wishlistRepository.count();
  }

  async findByUserAdmin(userId: string): Promise<Wishlist[]> {
    return this.wishlistRepository.find({
      where: { userId },
      relations: ['product', 'product.category'],
      order: { createdAt: 'DESC' },
    });
  }
}
