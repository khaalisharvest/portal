import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review, ReviewStatus } from '../entities/review.entity';
import { Order, OrderStatus } from '../../orders/entities/order.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { CreateReviewDto } from '../dto/create-review.dto';

export interface AdminReviewQuery {
  status?: ReviewStatus | 'all';
  productId?: string;
  page?: number;
  limit?: number;
}

export interface AdminReviewResult {
  reviews: Review[];
  total: number;
  stats: { pending: number; approved: number; rejected: number };
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
  ) {}

  // ── Public ──────────────────────────────────────────────────────────────────

  async create(productId: string, userId: string, dto: CreateReviewDto): Promise<Review> {
    const existing = await this.reviewRepository.findOne({ where: { productId, userId } });
    if (existing) throw new ConflictException('You have already reviewed this product');

    // Auto-verify: check for a delivered order containing this product
    const hasPurchased = await this.orderRepository
      .createQueryBuilder('o')
      .innerJoin('order_items', 'oi', 'oi."orderId" = o.id')
      .where('o."userId" = :userId', { userId })
      .andWhere('oi."productId" = :productId', { productId })
      .andWhere('o.status = :status', { status: OrderStatus.DELIVERED })
      .getCount()
      .then(n => n > 0)
      .catch(() => false); // non-critical — degrade gracefully

    const review = this.reviewRepository.create({
      ...dto,
      productId,
      userId,
      isVerified: hasPurchased,
      status: 'pending',
      isActive: true,
    });
    return this.reviewRepository.save(review);
  }

  async findByProduct(
    productId: string,
    page = 1,
    limit = 20,
  ): Promise<{ reviews: Review[]; total: number; avgRating: number }> {
    const take = Math.min(limit, 50);
    const skip = (page - 1) * take;
    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: { productId, status: 'approved', isActive: true },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take,
      skip,
    });
    const avgRating = total > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / total
      : 0;
    return { reviews, total, avgRating: Math.round(avgRating * 10) / 10 };
  }

  /** Returns a user's own review for a product (any status). */
  async findUserReview(productId: string, userId: string): Promise<Review | null> {
    return this.reviewRepository.findOne({ where: { productId, userId } });
  }

  async remove(reviewId: string, userId: string, userRole: string): Promise<void> {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId && !['super_admin', 'staff'].includes(userRole)) {
      throw new ForbiddenException('You can only delete your own reviews');
    }
    await this.reviewRepository.remove(review);
  }

  // ── Admin ────────────────────────────────────────────────────────────────────

  async findAllForAdmin(query: AdminReviewQuery): Promise<AdminReviewResult> {
    const page  = Math.max(1, query.page  ?? 1);
    const limit = Math.min(50, query.limit ?? 20);

    // Admin sees ALL reviews regardless of isActive — soft-delete isn't used, hard-delete is
    const where: Record<string, any> = {};
    if (query.status && query.status !== 'all') where.status = query.status;
    if (query.productId) where.productId = query.productId;

    const [reviews, total] = await this.reviewRepository.findAndCount({
      where,
      relations: ['user', 'product'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    const productFilter = query.productId ? { productId: query.productId } : {};
    const [pending, approved, rejected] = await Promise.all([
      this.reviewRepository.count({ where: { status: 'pending',  ...productFilter } }),
      this.reviewRepository.count({ where: { status: 'approved', ...productFilter } }),
      this.reviewRepository.count({ where: { status: 'rejected', ...productFilter } }),
    ]);

    return { reviews, total, stats: { pending, approved, rejected } };
  }

  async updateStatus(reviewId: string, status: ReviewStatus): Promise<Review> {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    review.status = status;
    return this.reviewRepository.save(review);
  }

  async removeAsAdmin(reviewId: string): Promise<void> {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    await this.reviewRepository.remove(review);
  }
}
