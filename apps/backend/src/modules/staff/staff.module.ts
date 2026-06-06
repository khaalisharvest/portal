import { Module } from '@nestjs/common';
import { StaffController } from './staff.controller';
import { ActivityModule } from '../activity/activity.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [ActivityModule, UsersModule],
  controllers: [StaffController],
})
export class StaffModule {}
