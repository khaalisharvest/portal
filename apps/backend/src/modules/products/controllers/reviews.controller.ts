import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards, Request, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
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
  @ApiOperation({ summary: 'Submit a review (status=pending until approved)' })
  create(@Param('productId') productId: string, @Body() dto: CreateReviewDto, @Request() req: any) {
    return this.reviewsService.create(productId, req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get approved reviews for a product (public)' })
  findAll(
    @Param('productId') productId: string,
    @Query('page',  new DefaultValuePipe(1),  ParseIntPipe) page:  number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
  ) {
    return this.reviewsService.findByProduct(productId, page, limit);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the authenticated user's own review (any status)" })
  findMine(@Param('productId') productId: string, @Request() req: any) {
    return this.reviewsService.findUserReview(productId, req.user.id);
  }

  @Delete(':reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete own review (admins can delete any)' })
  remove(@Param('reviewId') reviewId: string, @Request() req: any) {
    return this.reviewsService.remove(reviewId, req.user.id, req.user.role);
  }
}
