import { Controller, Post, Get, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReviewsService } from '../services/reviews.service';
import { CreateReviewDto } from '../dto/create-review.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Reviews')
@Controller('products/:productId/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review for a product' })
  create(@Param('productId') productId: string, @Body() dto: CreateReviewDto, @Request() req: any) {
    return this.reviewsService.create(productId, req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews for a product (public)' })
  findAll(@Param('productId') productId: string) {
    return this.reviewsService.findByProduct(productId);
  }

  @Delete(':reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review (own or admin)' })
  remove(@Param('reviewId') reviewId: string, @Request() req: any) {
    return this.reviewsService.remove(reviewId, req.user.id, req.user.role);
  }
}
