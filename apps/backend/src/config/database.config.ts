import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const dbHost = this.configService.get<string>('DB_HOST')!;
    const isLocalDatabase = ['postgres', 'localhost', '127.0.0.1'].includes(dbHost);
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    
    return {
      type: 'postgres',
      host: dbHost,
      port: this.configService.get<number>('DB_PORT')!,
      username: this.configService.get<string>('DB_USERNAME')!,
      password: this.configService.get<string>('DB_PASSWORD')!,
      database: this.configService.get<string>('DB_NAME')!,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      synchronize: nodeEnv === 'development',
      logging: nodeEnv === 'development' ? ['error', 'warn', 'migration'] : ['error'],
      ssl: nodeEnv === 'production' && !isLocalDatabase ? { rejectUnauthorized: false } : false,
      // Connection pool — prevents single-connection bottleneck under load
      extra: {
        max: 20,
        min: 2,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      },
      retryAttempts: 3,
      retryDelay: 3000,
    };
  }
}
