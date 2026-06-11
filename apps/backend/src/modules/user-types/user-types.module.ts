import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserType } from './entities/user-type.entity';
import { UserTypesService } from './user-types.service';
import { UserTypesController } from './user-types.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserType])],
  controllers: [UserTypesController],
  providers: [UserTypesService],
})
export class UserTypesModule {}
