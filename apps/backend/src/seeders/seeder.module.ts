import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { User } from '../modules/users/entities/user.entity';
import { SettingsModule } from '../modules/settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
    ]),
    SettingsModule,
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
