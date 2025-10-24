import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';
import { SettingsSeeder } from '../modules/settings/seeders/settings.seeder';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private settingsSeeder: SettingsSeeder,
  ) {}

  async seed() {
    console.log('🌱 Starting database seeding...');
    
    try {
      // Check if super admin already exists
      const existingSuperAdmin = await this.userRepository.findOne({
        where: { role: 'super_admin' }
      });

      if (!existingSuperAdmin) {
        // Create super admin
        await this.seedSuperAdmin();
      } else {
        console.log('✅ Super admin already exists, skipping...');
      }

      // Seed default settings
      await this.settingsSeeder.seed();
      
      console.log('✅ Database seeding completed successfully!');
      console.log('🌱 Khaalis Harvest platform is ready for admin management!');
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      throw error;
    }
  }

  private async seedSuperAdmin() {
    console.log('👑 Creating super admin...');
    
    const hashedPassword = await bcrypt.hash('superadmin123', 10);
    
    const superAdmin = this.userRepository.create({
      name: 'Super Admin',
      phone: '+923204749700',
      email: 'admin@fruitmandi.com',
      password: hashedPassword,
      role: 'super_admin',
      isActive: true,
      verification: {
        isVerified: true,
        verifiedAt: new Date(),
        verificationMethod: 'admin_created'
      }
    });

    await this.userRepository.save(superAdmin);
    
    console.log('  ✅ Super admin created successfully!');
    console.log('  📱 Phone: +923204749700');
    console.log('  🔑 Password: superadmin123');
  }
}