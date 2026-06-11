import { initSentry } from './instrument';
initSentry(); // Must run before NestJS initialises

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { SeederService } from './seeders/seeder.service';
import helmet from 'helmet';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const compression = require('compression');
import { PORT, ALLOWED_ORIGINS } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production'
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  const logger = new Logger('Bootstrap');

  // Run database seeder
  const seederService = app.get(SeederService);
  try {
    await seederService.seed();
  } catch (error) {
    logger.error('Seeder failed — app will continue but some defaults may be missing', error instanceof Error ? error.message : String(error));
    // Don't re-throw: a running app with missing settings is better than no app
  }

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // CORS configuration
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Graceful shutdown support
  app.enableShutdownHooks();

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation — disabled in production (exposes endpoint map to attackers)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Khaalis Harvest API')
      .setDescription("Pakistan's premier organic marketplace API")
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(PORT);
  logger.log(`API Server running on http://localhost:${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    logger.log(`API Docs: http://localhost:${PORT}/api/docs`);
  }
  logger.log(`Environment: ${process.env.NODE_ENV}`);
}

bootstrap();
