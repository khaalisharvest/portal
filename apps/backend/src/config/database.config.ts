import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const dbHost = this.configService.get('DB_HOST')!;
    const isLocalDatabase = dbHost === 'postgres' || dbHost === 'localhost' || dbHost === '127.0.0.1';
    const nodeEnv = this.configService.get('NODE_ENV');
    
    return {
      type: 'postgres',
      host: dbHost,
      port: this.configService.get('DB_PORT')!,
      username: this.configService.get('DB_USERNAME')!,
      password: this.configService.get('DB_PASSWORD')!,
      database: this.configService.get('DB_NAME')!,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      synchronize: true, // Temporarily enabled to create initial schema
      logging: nodeEnv === 'development',
      // Only use SSL for remote databases, not local Docker containers
      ssl: nodeEnv === 'production' && !isLocalDatabase ? { rejectUnauthorized: false } : false,
    };
  }
}
