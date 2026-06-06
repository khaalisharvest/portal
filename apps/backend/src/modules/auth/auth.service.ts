import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { normalizePhoneForDatabase } from '../../utils/phoneValidation';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { EmailService } from '../notifications/email.service';
import { env } from '../../config/env';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { password, phone, ...userData } = registerDto;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Normalize phone number to international format for SMS/WhatsApp compatibility
    const normalizedPhone = normalizePhoneForDatabase(phone);
    
    const user = await this.usersService.create({
      ...userData,
      role: userData.role ?? 'customer',
      phone: normalizedPhone,
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

  async forgotPassword(identifier: string): Promise<{ message: string }> {
    const normalizedId = identifier.includes('@')
      ? identifier
      : normalizePhoneForDatabase(identifier);

    const user = identifier.includes('@')
      ? await this.usersService.findByEmail(normalizedId)
      : await this.usersService.findByPhone(normalizedId);

    if (!user) {
      return { message: 'If an account exists, a reset link has been sent.' };
    }

    const token = randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000);
    await this.usersService.setResetToken(user.id, token, expiry);

    const resetUrl = `${env.FRONTEND_URL}/auth/reset-password?token=${token}`;
    const html = `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px">
      <h2 style="color:#4B8B3B">🌿 Reset Your Password</h2>
      <p>Click the button below to reset your Khaalis Harvest password. This link expires in 1 hour.</p>
      <a href="${resetUrl}" style="display:inline-block;background:#4B8B3B;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">Reset Password</a>
      <p style="color:#737373;font-size:12px">If you didn't request this, ignore this email.</p>
      <p style="color:#737373;font-size:11px">Link: ${resetUrl}</p>
    </div>`;

    if (user.email) {
      await this.emailService.send(user.email, 'Reset Your Khaalis Harvest Password', html);
    } else {
      // Log the link to console for phone-only users in development
      console.log(`[PASSWORD RESET LINK] ${resetUrl}`);
    }

    return { message: 'If an account exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.usersService.findByResetToken(token);
    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(user.id, hashed);
    return { message: 'Password reset successfully. You can now log in.' };
  }

  private async generateTokens(userId: string) {
    const payload = { sub: userId };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '30d' }),
    };
  }
}
