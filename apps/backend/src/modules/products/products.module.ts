import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesController } from './categories.controller';
import { ProductsController } from './products.controller';
import { SuppliersController } from './controllers/suppliers.controller';
import { ReviewsController } from './controllers/reviews.controller';
import { CategoriesService } from './categories.service';
import { ProductsService } from './products.service';
import { SuppliersService } from './services/suppliers.service';
import { ReviewsService } from './services/reviews.service';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { Supplier } from './entities/supplier.entity';
import { Review } from './entities/review.entity';
import { Wishlist } from './entities/wishlist.entity';
import { ProductType } from '../product-types/entities/product-type.entity';
import { SettingsModule } from '../settings/settings.module';
import { ProductComponent } from './entities/product-component.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category, Supplier, ProductType, ProductComponent, Review, Wishlist]),
    SettingsModule,
  ],
  controllers: [CategoriesController, SuppliersController, ProductsController, ReviewsController],
  providers: [CategoriesService, SuppliersService, ProductsService, ReviewsService],
  exports: [CategoriesService, SuppliersService, ProductsService, ReviewsService],
})
export class ProductsModule {}
