import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';

// Configuration
import { DatabaseConfig } from './config/database.config';
import { RedisConfig } from './config/redis.config';

// Common modules
import { CommonModule } from './common/common.module';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { ProductTypesModule } from './modules/product-types/product-types.module';
import { OrdersModule } from './modules/orders/orders.module';
import { SettingsModule } from './modules/settings/settings.module';
import { HealthModule } from './health/health.module';
import { SeederService } from './seeders/seeder.service';
import { User } from './modules/users/entities/user.entity';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),
    
    // User entity for seeding
    TypeOrmModule.forFeature([User]),

    // Cache - Temporarily disabled for Docker
    // CacheModule.registerAsync({
    //   useClass: RedisConfig,
    //   isGlobal: true,
    // }),

    // Queue - Temporarily disabled for Docker
    // BullModule.forRoot({
    //   redis: {
    //     host: process.env.REDIS_HOST || 'redis',
    //     port: parseInt(process.env.REDIS_PORT) || 6379,
    //     password: process.env.REDIS_PASSWORD,
    //   },
    // }),

    // Scheduler
    ScheduleModule.forRoot(),

    // Common
    CommonModule,

    // Health
    HealthModule,

    // Feature modules
    AuthModule,
    UsersModule,
    ProductsModule,
    ProductTypesModule,
    OrdersModule,
    SettingsModule,
  ],
  providers: [SeederService],
})
export class AppModule {}
