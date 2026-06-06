import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';
import { SettingsService } from '../modules/settings/services/settings.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private settingsService: SettingsService,
  ) {}

  async seed() {
    console.log('Starting database seeding...');
    try {
      await this.seedSuperAdmin();
      await this.settingsService.initializeDefaultSettings();
      console.log('Database seeding completed successfully!');
    } catch (error) {
      console.error('Database seeding failed:', error);
      throw error;
    }
  }

  private async seedSuperAdmin() {
    const existing = await this.userRepository.findOne({ where: { role: 'super_admin' } });
    if (existing) {
      console.log('Super admin already exists, skipping...');
      return;
    }

    const hashedPassword = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD, 10);
    await this.userRepository.save(
      this.userRepository.create({
        name: 'Super Admin',
        phone: process.env.SUPER_ADMIN_PHONE,
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
    console.log('Super admin created — email:', process.env.SUPER_ADMIN_EMAIL);
  }
}
