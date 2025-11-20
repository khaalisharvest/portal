import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModuleOptions, ThrottlerOptionsFactory } from '@nestjs/throttler';
import Redis from 'ioredis';

@Injectable()
export class ThrottlerConfig implements ThrottlerOptionsFactory, OnModuleDestroy {
  private readonly logger = new Logger(ThrottlerConfig.name);
  private redis: Redis;

  constructor(private configService: ConfigService) {}

  createThrottlerOptions(): ThrottlerModuleOptions {
    const maxRetries = 3;

    // Create Redis client for throttler storage
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST') || 'redis',
      port: parseInt(this.configService.get('REDIS_PORT') || '6379'),
      password: this.configService.get('REDIS_PASSWORD') || undefined,
      family: 4, // Force IPv4 to avoid IPv6 connection issues
      maxRetriesPerRequest: maxRetries,
      retryStrategy: (times) => {
        if (times > maxRetries) {
          this.logger.error(`Redis throttler connection failed after ${maxRetries} retries`);
          return null; // Stop retrying
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      enableReadyCheck: true,
      enableOfflineQueue: false, // Don't queue commands when offline
      lazyConnect: false,
    });

    // Add event handlers for monitoring
    this.redis.on('connect', () => {
      this.logger.log('Redis throttler client connected');
    });

    this.redis.on('ready', () => {
      this.logger.log('Redis throttler client ready');
    });

    this.redis.on('error', (error) => {
      this.logger.error(`Redis throttler client error: ${error.message}`, error.stack);
    });

    this.redis.on('close', () => {
      this.logger.warn('Redis throttler client connection closed');
    });

    this.redis.on('reconnecting', (delay) => {
      this.logger.warn(`Redis throttler client reconnecting in ${delay}ms`);
    });

    return {
      throttlers: [
        {
          // General API rate limit: 100 requests per minute
          ttl: 60000, // 1 minute
          limit: 100,
        },
      ],
      storage: {
        async increment(key: string, ttl: number, limit: number, blockDuration: number, throttlerName: string) {
          try {
            const multi = this.redis.multi();
            multi.incr(key);
            multi.pexpire(key, ttl);
            const results = await multi.exec();
            const totalHits = results?.[0]?.[1] as number || 0;
            const timeToExpire = await this.redis.pttl(key);
            const isBlocked = totalHits >= limit;
            
            return {
              totalHits,
              timeToExpire,
              isBlocked,
              timeToBlockExpire: isBlocked ? blockDuration : 0,
            };
          } catch (error) {
            this.logger.error(`Throttler increment failed for key ${key}: ${error.message}`);
            // Return non-blocking response on error to allow request through
            return {
              totalHits: 0,
              timeToExpire: 0,
              isBlocked: false,
              timeToBlockExpire: 0,
            };
          }
        },
      },
    };
  }

  onModuleDestroy() {
    if (this.redis) {
      this.redis.quit();
      this.logger.log('Redis throttler client disconnected');
    }
  }
}

