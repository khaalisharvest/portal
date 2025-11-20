import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModuleOptions, ThrottlerOptionsFactory } from '@nestjs/throttler';
import Redis from 'ioredis';

@Injectable()
export class ThrottlerConfig implements ThrottlerOptionsFactory {
  constructor(private configService: ConfigService) {}

  createThrottlerOptions(): ThrottlerModuleOptions {
    // Create Redis client for throttler storage
    const redis = new Redis({
      host: this.configService.get('REDIS_HOST') || 'redis',
      port: parseInt(this.configService.get('REDIS_PORT') || '6379'),
      password: this.configService.get('REDIS_PASSWORD') || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
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
          const multi = redis.multi();
          multi.incr(key);
          multi.pexpire(key, ttl);
          const results = await multi.exec();
          const totalHits = results?.[0]?.[1] as number || 0;
          const timeToExpire = await redis.pttl(key);
          const isBlocked = totalHits >= limit;
          
          return {
            totalHits,
            timeToExpire,
            isBlocked,
            timeToBlockExpire: isBlocked ? blockDuration : 0,
          };
        },
      },
    };
  }
}

