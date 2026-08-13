import { Controller, Post, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WishlistService } from '../services/wishlist.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../../common/guards/roles.guard';

@ApiTags('Wishlist')
@Controller('wishlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  // ── Admin routes first — NestJS matches static paths before parameterized ──

  @Get('admin/popular')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'staff')
  @ApiOperation({ summary: 'Admin: most wishlisted products with counts' })
  getPopular() {
    return this.wishlistService.getPopularProducts();
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'staff')
  @ApiOperation({ summary: 'Admin: total wishlist count' })
  async getStats() {
    const total = await this.wishlistService.getTotalCount();
    return { total };
  }

  @Get('admin/user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'staff')
  @ApiOperation({ summary: 'Admin: get wishlist for a specific user' })
  getUserWishlist(@Param('userId') userId: string) {
    return this.wishlistService.findByUserAdmin(userId);
  }

  // ── Customer routes ───────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Get all wishlist items for logged-in user' })
  findAll(@Request() req: any) {
    return this.wishlistService.findByUser(req.user.id);
  }

  @Get(':productId/check')
  @ApiOperation({ summary: 'Check if product is in wishlist' })
  async check(@Param('productId') productId: string, @Request() req: any) {
    const isWishlisted = await this.wishlistService.isWishlisted(req.user.id, productId);
    return { isWishlisted };
  }

  @Post(':productId')
  @ApiOperation({ summary: 'Toggle product in/out of wishlist' })
  toggle(@Param('productId') productId: string, @Request() req: any) {
    return this.wishlistService.toggle(req.user.id, productId);
  }
}
