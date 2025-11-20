import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheModuleOptions, CacheOptionsFactory } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

/**
 * Redis Cache Configuration for NestJS
 * 
 * Best Practice Implementation:
 * - Uses cache-manager-redis-yet (recommended for cache-manager v5)
 * - Internally uses 'redis' package v4.x (not ioredis)
 * - Proper IPv4 configuration via socket.family
 * - Error handling and monitoring
 * - Connection pooling handled automatically by the 'redis' package
 */
@Injectable()
export class RedisConfig implements CacheOptionsFactory {
  private readonly logger = new Logger(RedisConfig.name);

  constructor(private configService: ConfigService) {}

  async createCacheOptions(): Promise<CacheModuleOptions> {
    const redisHost = this.configService.get('REDIS_HOST') || 'redis';
    const redisPort = parseInt(this.configService.get('REDIS_PORT') || '6379');
    const redisPassword = this.configService.get('REDIS_PASSWORD');

    // Configuration for 'redis' package v4.x (used by cache-manager-redis-yet)
    // socket.family: 4 forces IPv4 to avoid IPv6 connection issues
    const redisOptions = {
      socket: {
        host: redisHost,
        port: redisPort,
        family: 4, // Force IPv4 - prevents ::1:6379 connection attempts
        connectTimeout: 10000, // 10 second connection timeout
        keepAlive: 30000, // Keep connection alive for 30 seconds
        reconnectStrategy: (retries: number) => {
          if (retries > 3) {
            this.logger.error(`Redis cache connection failed after ${retries} retries`);
            return new Error('Redis connection failed');
          }
          const delay = Math.min(retries * 50, 2000);
          return delay;
        },
      },
      password: redisPassword || undefined,
    };

    try {
      // redisStore creates and connects its own Redis client
      // This is the recommended approach - let the library manage the connection
      const store = await redisStore(redisOptions as any);

      // Add event handlers for monitoring
      if (store.client) {
        store.client.on('error', (error: Error) => {
          this.logger.error(`Redis cache client error: ${error.message}`, error.stack);
        });

        store.client.on('connect', () => {
          this.logger.log('Redis cache client connected');
        });

        store.client.on('ready', () => {
          this.logger.log('Redis cache client ready');
        });

        store.client.on('reconnecting', () => {
          this.logger.warn('Redis cache client reconnecting');
        });

        store.client.on('end', () => {
          this.logger.warn('Redis cache client connection ended');
        });
      }

      return {
        store: store as any,
        ttl: parseInt(this.configService.get('REDIS_TTL') || '300') * 1000, // Convert seconds to milliseconds
      };
    } catch (error) {
      this.logger.error(`Failed to create Redis cache store: ${error.message}`, error.stack);
      throw error;
    }
  }
}
