import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';

// Configuration
import { DatabaseConfig } from './config/database.config';
import { RedisConfig } from './config/redis.config';
import { ThrottlerConfig } from './config/throttler.config';

// Common modules
import { CommonModule } from './common/common.module';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { ProductTypesModule } from './modules/product-types/product-types.module';
import { OrdersModule } from './modules/orders/orders.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ContactsModule } from './modules/contacts/contacts.module';
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

    // Cache - Redis caching for frequently accessed data
    // Temporarily disabled due to IPv6 connection issue - will fix with cache-manager-redis-yet
    // CacheModule.registerAsync({
    //   useClass: RedisConfig,
    //   isGlobal: true,
    // }),

    // Rate Limiting - Redis-based throttling
    ThrottlerModule.forRootAsync({
      useClass: ThrottlerConfig,
    }),

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
    ContactsModule,
  ],
  providers: [
    SeederService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
