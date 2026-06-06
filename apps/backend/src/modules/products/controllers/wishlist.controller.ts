import { Controller, Post, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WishlistService } from '../services/wishlist.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Wishlist')
@Controller('wishlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post(':productId')
  @ApiOperation({ summary: 'Toggle product in/out of wishlist' })
  toggle(@Param('productId') productId: string, @Request() req: any) {
    return this.wishlistService.toggle(req.user.id, productId);
  }

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
}
