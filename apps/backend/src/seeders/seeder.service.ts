import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';
import { SettingsService } from '../modules/settings/services/settings.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private settingsService: SettingsService,
  ) {}

  async seed() {
    this.logger.log('Starting database seeding...');
    try {
      await this.seedSuperAdmin();
      await this.settingsService.initializeDefaultSettings();
      this.logger.log('Database seeding completed successfully');
    } catch (error) {
      this.logger.error('Database seeding failed', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  private async seedSuperAdmin() {
    const existing = await this.userRepository.findOne({ where: { role: 'super_admin' } });
    if (existing) {
      this.logger.log('Super admin already exists, skipping');
      return;
    }

    const hashedPassword = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD!, 10);
    await this.userRepository.save(
      this.userRepository.create({
        name: 'Super Admin',
        phone: process.env.SUPER_ADMIN_PHONE!,
        email: process.env.SUPER_ADMIN_EMAIL,
        password: hashedPassword,
        role: 'super_admin',
        isActive: true,
        verification: {
          isVerified: true,
          verifiedAt: new Date(),
          verificationMethod: 'admin_created',
        },
      }),
    );
    this.logger.log(`Super admin created — email: ${process.env.SUPER_ADMIN_EMAIL}`);
  }
}
