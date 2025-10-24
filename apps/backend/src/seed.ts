import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeederService } from './seeders/seeder.service';

async function bootstrap() {
  console.log('🌱 Starting database seeder...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const seederService = app.get(SeederService);
  
  try {
    await seederService.seed();
    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
