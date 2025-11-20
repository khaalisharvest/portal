import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheModuleOptions, CacheOptionsFactory } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

@Injectable()
export class RedisConfig implements CacheOptionsFactory {
  constructor(private configService: ConfigService) {}

  createCacheOptions(): CacheModuleOptions {
    const redisHost = this.configService.get('REDIS_HOST') || 'redis';
    const redisPort = parseInt(this.configService.get('REDIS_PORT') || '6379');
    const redisPassword = this.configService.get('REDIS_PASSWORD');

    return {
      store: redisStore as any,
      host: redisHost,
      port: redisPort,
      password: redisPassword || undefined,
      // Use socket options to force IPv4
      socket: {
        family: 4, // Force IPv4 to avoid IPv6 connection issues
      },
      ttl: parseInt(this.configService.get('REDIS_TTL') || '300'),
    };
  }
}
