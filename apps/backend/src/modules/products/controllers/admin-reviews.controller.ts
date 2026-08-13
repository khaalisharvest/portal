import { Controller, Get, Patch, Delete, Param, Query, UseGuards, ParseIntPipe, DefaultValuePipe, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReviewsService } from '../services/reviews.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../../common/guards/roles.guard';
import { ReviewStatus } from '../entities/review.entity';

@ApiTags('Admin Reviews')
@ApiBearerAuth()
@Controller('admin/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'staff')
export class AdminReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'List all reviews with optional status/product filter' })
  @ApiQuery({ name: 'status',    enum: ['all', 'pending', 'approved', 'rejected'], required: false })
  @ApiQuery({ name: 'productId', type: String, required: false })
  @ApiQuery({ name: 'page',      type: Number, required: false })
  @ApiQuery({ name: 'limit',     type: Number, required: false })
  findAll(
    @Query('status')    status?: string,
    @Query('productId') productId?: string,
    @Query('page',  new DefaultValuePipe(1),  ParseIntPipe) page:  number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
  ) {
    return this.reviewsService.findAllForAdmin({ status: status as any, productId, page, limit });
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Approve or reject a review' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ReviewStatus,
  ) {
    return this.reviewsService.updateStatus(id, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hard-delete a review' })
  remove(@Param('id') id: string) {
    return this.reviewsService.removeAsAdmin(id);
  }
}
