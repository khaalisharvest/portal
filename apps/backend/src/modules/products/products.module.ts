import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesController } from './categories.controller';
import { ProductsController } from './products.controller';
import { ReviewsController } from './controllers/reviews.controller';
import { AdminReviewsController } from './controllers/admin-reviews.controller';
import { WishlistController } from './controllers/wishlist.controller';
import { UploadController } from './controllers/upload.controller';
import { InventoryController } from './controllers/inventory.controller';
import { CategoriesService } from './categories.service';
import { ProductsService } from './products.service';
import { CloudinaryService } from './services/cloudinary.service';
import { ReviewsService } from './services/reviews.service';
import { WishlistService } from './services/wishlist.service';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { Review } from './entities/review.entity';
import { Wishlist } from './entities/wishlist.entity';
import { Inventory } from './entities/inventory.entity';
import { ProductType } from '../product-types/entities/product-type.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { SettingsModule } from '../settings/settings.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product, Category, ProductType, Review, Wishlist, Inventory,
      Order, OrderItem,
    ]),
    SettingsModule,
    ActivityModule,
  ],
  controllers: [
    CategoriesController, ProductsController,
    ReviewsController, AdminReviewsController,
    WishlistController, UploadController, InventoryController,
  ],
  providers: [CategoriesService, CloudinaryService, ProductsService, ReviewsService, WishlistService],
  exports: [CategoriesService, CloudinaryService, ProductsService, ReviewsService, WishlistService],
})
export class ProductsModule {}
