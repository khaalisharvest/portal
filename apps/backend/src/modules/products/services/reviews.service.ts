import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../entities/review.entity';
import { Product } from '../entities/product.entity';
import { CreateReviewDto } from '../dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(productId: string, userId: string, dto: CreateReviewDto): Promise<Review> {
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const existing = await this.reviewRepository.findOne({ where: { productId, userId } });
    if (existing) throw new ConflictException('You have already reviewed this product');

    const review = this.reviewRepository.create({ ...dto, productId, userId });
    const saved = await this.reviewRepository.save(review);
    await this.updateProductRating(productId);
    return saved;
  }

  async findByProduct(productId: string): Promise<{ reviews: Review[]; total: number; avgRating: number }> {
    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: { productId, isActive: true },
      order: { createdAt: 'DESC' },
    });
    const avgRating = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
    return { reviews, total, avgRating: Math.round(avgRating * 10) / 10 };
  }

  async remove(reviewId: string, userId: string, userRole: string): Promise<void> {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId && !['admin', 'super_admin'].includes(userRole)) {
      throw new ForbiddenException('You can only delete your own reviews');
    }
    await this.reviewRepository.remove(review);
    await this.updateProductRating(review.productId);
  }

  private async updateProductRating(productId: string): Promise<void> {
    const result = await this.reviewRepository
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(r.id)', 'count')
      .where('r.productId = :productId AND r.isActive = true', { productId })
      .getRawOne();
    await this.productRepository.update(productId, {
      rating: result.avg ? Math.round(parseFloat(result.avg) * 10) / 10 : 0,
      reviewCount: parseInt(result.count) || 0,
    });
  }
}
