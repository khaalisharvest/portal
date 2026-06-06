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

    // Use delete-first approach to handle concurrent requests atomically
    const existing = await this.wishlistRepository.findOne({ where: { userId, productId } });

    if (existing) {
      await this.wishlistRepository.delete({ userId, productId });
      return { added: false };
    }

    try {
      await this.wishlistRepository
        .createQueryBuilder()
        .insert()
        .into('wishlists')
        .values({ userId, productId, isActive: true })
        .orIgnore() // PostgreSQL: ON CONFLICT DO NOTHING
        .execute();
      return { added: true };
    } catch {
      // Already exists (concurrent insert won the race) — treat as added
      return { added: true };
    }
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
}
