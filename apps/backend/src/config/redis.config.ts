import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheModuleOptions, CacheOptionsFactory } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import Redis from 'ioredis';

@Injectable()
export class RedisConfig implements CacheOptionsFactory {
  constructor(private configService: ConfigService) {}

  createCacheOptions(): CacheModuleOptions {
    // Create ioredis client with IPv4 to avoid IPv6 connection issues
    const redisClient = new Redis({
      host: this.configService.get('REDIS_HOST') || 'redis',
      port: parseInt(this.configService.get('REDIS_PORT') || '6379'),
      password: this.configService.get('REDIS_PASSWORD') || undefined,
      family: 4, // Force IPv4
    });

    return {
      store: redisStore as any,
      client: redisClient as any,
      ttl: parseInt(this.configService.get('REDIS_TTL') || '300'),
    };
  }
}
