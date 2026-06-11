import { Injectable, Inject } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class HealthService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async check() {
    const [dbStatus, redisStatus] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    return {
      status: dbStatus === 'up' && redisStatus === 'up' ? 'ok' : 'degraded',
      database: dbStatus,
      redis: redisStatus,
      timestamp: new Date().toISOString(),
    };
  }

  async ready() {
    const dbStatus = await this.checkDatabase();
    const isReady = dbStatus === 'up';

    if (!isReady) {
      throw new Error('Service not ready');
    }

    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }

  async live() {
    return { status: 'alive', timestamp: new Date().toISOString() };
  }

  private async checkDatabase(): Promise<'up' | 'down'> {
    try {
      await this.dataSource.query('SELECT 1');
      return 'up';
    } catch (error) {
      return 'down';
    }
  }

  private async checkRedis(): Promise<'up' | 'down'> {
    try {
      await this.cacheManager.get('__health_check__');
      return 'up';
    } catch {
      return 'down';
    }
  }
}
