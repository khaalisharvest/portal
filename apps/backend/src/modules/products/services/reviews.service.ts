import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../entities/review.entity';
import { CreateReviewDto } from '../dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
  ) {}

  async create(productId: string, userId: string, dto: CreateReviewDto): Promise<Review> {
    const existing = await this.reviewRepository.findOne({ where: { productId, userId } });
    if (existing) throw new ConflictException('You have already reviewed this product');

    // isVerified is always false on creation — admin can mark verified after
    // checking purchase history. Avoids circular dependency with OrdersModule.
    const review = this.reviewRepository.create({ ...dto, productId, userId, isVerified: false });
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
    if (review.userId !== userId && !['super_admin', 'staff'].includes(userRole)) {
      throw new ForbiddenException('You can only delete your own reviews');
    }
    await this.reviewRepository.remove(review);
    await this.updateProductRating(review.productId);
  }

  private async updateProductRating(_productId: string): Promise<void> {
    // rating and reviewCount fields no longer exist on Product entity —
    // aggregate stats are computed on-the-fly in findByProduct()
  }
}
