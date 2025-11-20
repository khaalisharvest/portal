import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheModuleOptions, CacheOptionsFactory } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import Redis from 'ioredis';

@Injectable()
export class RedisConfig implements CacheOptionsFactory, OnModuleDestroy {
  private readonly logger = new Logger(RedisConfig.name);
  private redisClient: Redis;

  constructor(private configService: ConfigService) {}

  createCacheOptions(): CacheModuleOptions {
    const redisHost = this.configService.get('REDIS_HOST') || 'redis';
    const redisPort = parseInt(this.configService.get('REDIS_PORT') || '6379');
    const redisPassword = this.configService.get('REDIS_PASSWORD');
    const maxRetries = 3;

    // Create ioredis client with IPv4 to avoid IPv6 connection issues
    this.redisClient = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword || undefined,
      family: 4, // Force IPv4 to avoid IPv6 connection issues
      maxRetriesPerRequest: maxRetries,
      retryStrategy: (times) => {
        if (times > maxRetries) {
          this.logger.error(`Redis connection failed after ${maxRetries} retries`);
          return null; // Stop retrying
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      // Connection pooling for better performance
      enableReadyCheck: true,
      enableOfflineQueue: false, // Don't queue commands when offline
      lazyConnect: false,
      // Connection pool settings
      keepAlive: 30000, // Keep connection alive for 30 seconds
      connectTimeout: 10000, // 10 second connection timeout
    });

    // Add event handlers for monitoring
    this.redisClient.on('connect', () => {
      this.logger.log('Redis cache client connected');
    });

    this.redisClient.on('ready', () => {
      this.logger.log('Redis cache client ready');
    });

    this.redisClient.on('error', (error) => {
      this.logger.error(`Redis cache client error: ${error.message}`, error.stack);
    });

    this.redisClient.on('close', () => {
      this.logger.warn('Redis cache client connection closed');
    });

    this.redisClient.on('reconnecting', (delay) => {
      this.logger.warn(`Redis cache client reconnecting in ${delay}ms`);
    });

    return {
      store: redisStore as any,
      client: this.redisClient as any,
      ttl: parseInt(this.configService.get('REDIS_TTL') || '300') * 1000, // Convert seconds to milliseconds
    };
  }

  onModuleDestroy() {
    if (this.redisClient) {
      this.redisClient.quit();
      this.logger.log('Redis cache client disconnected');
    }
  }
}
