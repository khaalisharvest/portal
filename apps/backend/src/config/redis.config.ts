import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheModuleOptions, CacheOptionsFactory } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

@Injectable()
export class RedisConfig implements CacheOptionsFactory {
  constructor(private configService: ConfigService) {}

  createCacheOptions(): CacheModuleOptions {
    return {
      store: redisStore as any,
      host: this.configService.get('REDIS_HOST')!,
      port: this.configService.get('REDIS_PORT')!,
      password: this.configService.get('REDIS_PASSWORD'),
      ttl: parseInt(this.configService.get('REDIS_TTL') || '300'),
    };
  }
}
