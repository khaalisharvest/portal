import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { normalizePhoneForDatabase } from '../../utils/phoneValidation';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { password, phone, ...userData } = registerDto;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Normalize phone number to international format for SMS/WhatsApp compatibility
    const normalizedPhone = normalizePhoneForDatabase(phone);
    
    const user = await this.usersService.create({
      ...userData,
      phone: normalizedPhone, // Store in +923001234567 format
      password: hashedPassword,
    });

    const tokens = await this.generateTokens(user.id);
    return { user, ...tokens };
  }

  async login(loginDto: LoginDto) {
    // Normalize phone number before validation
    const normalizedPhone = normalizePhoneForDatabase(loginDto.phone);
    
    // First check if user exists and is active
    const user = await this.usersService.findByPhone(normalizedPhone);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    // Check if account is active before password validation
    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated. Please contact support for assistance.');
    }
    
    // Validate password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login timestamp
    user.lastLoginAt = new Date();
    await this.usersService.updateLastLogin(user.id);

    const tokens = await this.generateTokens(user.id);
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, ...tokens };
  }

  async validateUser(phone: string, password: string): Promise<any> {
    const user = await this.usersService.findByPhone(phone);
    
    if (user) {
      // Check if user account is active
      if (!user.isActive) {
        console.warn(`[Auth] Login attempt for inactive user: ${user.id}`);
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (isPasswordValid) {
        const { password, ...result } = user;
        return result;
      } else {
        // Log the issue for monitoring but don't expose details
        console.warn(`[Auth] Password validation failed for user: ${user.id}`);
        return null;
      }
    }
    
    return null;
  }

  async getProfile(userId: string) {
    return this.usersService.findById(userId);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException();
      }
      return this.generateTokens(user.id);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(userId: string) {
    const payload = { sub: userId };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '30d' }),
    };
  }
}
