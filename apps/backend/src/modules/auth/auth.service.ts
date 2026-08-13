import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomInt } from 'crypto';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { normalizePhoneForDatabase } from '../../utils/phoneValidation';
import * as bcrypt from 'bcryptjs';
import { EmailService } from '../notifications/email.service';
import { WhatsAppService } from '../notifications/whatsapp.service';
import { env } from '../../config/env';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private whatsAppService: WhatsAppService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { password, phone, ...userData } = registerDto;
    const normalizedPhone = normalizePhoneForDatabase(phone);

    const existing = await this.usersService.findByPhone(normalizedPhone);
    if (existing) {
      throw new ConflictException('An account with this phone number already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = await this.usersService.create({
        ...userData,
        role: userData.role ?? 'customer',
        phone: normalizedPhone,
        password: hashedPassword,
      });
      const tokens = await this.generateTokens(user.id, user.role);
      return { user, ...tokens };
    } catch (err) {
      if (err?.code === '23505') {
        throw new ConflictException('An account with this phone number already exists.');
      }
      throw err;
    }
  }

  async login(loginDto: LoginDto) {
    const normalizedPhone = normalizePhoneForDatabase(loginDto.phone);
    const user = await this.usersService.findByPhoneWithPassword(normalizedPhone);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated. Please contact support for assistance.');
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(`Account locked. Try again in ${minutesLeft} minute(s).`);
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      // Increment attempts and lock if >= 5
      const attempts = (user.loginAttempts || 0) + 1;
      const lockedUntil = attempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null;
      await this.usersService.updateLoginAttempts(user.id, attempts, lockedUntil);
      this.logger.warn(`Failed login attempt ${attempts}/5 for user ${user.id}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Success: reset attempts
    await this.usersService.updateLoginAttempts(user.id, 0, null);
    await this.usersService.updateLastLogin(user.id);

    const tokens = await this.generateTokens(user.id, user.role);
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, ...tokens };
  }

  async validateUser(phone: string, password: string): Promise<any> {
    const user = await this.usersService.findByPhoneWithPassword(phone);
    
    if (user) {
      // Check if user account is active
      if (!user.isActive) {
        this.logger.warn(`Login attempt for inactive user: ${user.id}`);
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (isPasswordValid) {
        const { password, ...result } = user;
        return result;
      } else {
        // Log the issue for monitoring but don't expose details
        this.logger.warn(`Password validation failed for user: ${user.id}`);
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
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }
      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException();
      }
      return this.generateTokens(user.id, user.role);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(identifier: string): Promise<{
    message: string; channel?: string; maskedContact?: string;
    identifier?: string; action?: string; adminWhatsapp?: string;
  }> {
    const normalizedId = identifier.includes('@')
      ? identifier.trim().toLowerCase()
      : normalizePhoneForDatabase(identifier);

    const user = identifier.includes('@')
      ? await this.usersService.findByEmail(normalizedId)
      : await this.usersService.findByPhone(normalizedId);

    if (!user) {
      throw new BadRequestException(
        identifier.includes('@')
          ? 'No account found with this email address. Please check and try again.'
          : 'No account found with this phone number. Please check and try again.',
      );
    }

    // Contact-admin path — no OTP needed, admin resets directly via dashboard
    if (!user.email && !env.WHATSAPP_PHONE_NUMBER_ID) {
      return {
        message: 'Password reset via WhatsApp is not available. Please contact admin.',
        action: 'contact_admin',
        adminWhatsapp: env.ADMIN_WHATSAPP,
      };
    }

    // Generate cryptographically secure 6-digit OTP
    const otp = String(randomInt(100000, 1000000));
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:#3d7a2e;padding:24px 28px">
    <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:700">Khaalis Harvest</h1>
    <p style="color:#a8d5a2;margin:4px 0 0;font-size:13px">The Pure Embrace of Nature</p>
  </div>
  <div style="padding:32px 28px">
    <h2 style="color:#111827;margin:0 0 8px;font-size:22px;font-weight:700">Password Reset Code</h2>
    <p style="color:#6b7280;margin:0 0 24px;font-size:15px;line-height:1.6">Use the code below to reset your password. It expires in <strong>15 minutes</strong>.</p>
    <div style="background:#f0fdf4;border:2px solid #3d7a2e;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
      <p style="margin:0 0 4px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:1px">Your reset code</p>
      <p style="margin:0;font-size:40px;font-weight:800;color:#3d7a2e;letter-spacing:8px">${otp}</p>
    </div>
    <p style="color:#9ca3af;font-size:13px;margin:0;line-height:1.6">If you didn't request this, you can safely ignore this email.</p>
  </div>
  <div style="background:#f9fafb;padding:16px 28px;border-top:1px solid #e5e7eb">
    <p style="color:#9ca3af;font-size:12px;margin:0">Khaalis Harvest · Pakistan's organic marketplace</p>
  </div>
</div>`;

    if (user.email) {
      // Send FIRST — only store OTP if delivery succeeds (C3 fix)
      await this.emailService.sendCritical(user.email, 'Your Khaalis Harvest Password Reset Code', html);
      await this.usersService.setResetToken(user.id, otp, expiry);
      const maskedEmail = user.email.replace(/(.{2})[^@]*(@.*)/, '$1***$2');
      return { message: 'If an account exists, a reset code has been sent.', channel: 'email', maskedContact: maskedEmail, identifier: normalizedId };
    }

    // WhatsApp path — send FIRST, then store (C3 fix)
    await this.whatsAppService.sendOtp(user.phone, otp);
    await this.usersService.setResetToken(user.id, otp, expiry);
    const digits = user.phone.replace(/\D/g, '');
    const maskedPhone = `+${digits.slice(0, 4)}***${digits.slice(-4)}`;
    return { message: 'If an account exists, a reset code has been sent.', channel: 'whatsapp', maskedContact: maskedPhone, identifier: normalizedId };
  }

  async updateProfile(userId: string, updates: { name?: string; email?: string }) {
    const allowed: any = {};
    if (updates.name?.trim()) allowed.name = updates.name.trim();
    if (updates.email !== undefined) allowed.email = updates.email || null;
    const user = await this.usersService.update(userId, allowed);
    const { password, ...result } = user as any;
    return result;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    if (!newPassword || newPassword.length < 8) {
      throw new UnauthorizedException('New password must be at least 8 characters.');
    }
    const user = await this.usersService.findById(userId);
    const full = await this.usersService.findByPhoneWithPassword(user.phone);
    if (!full) throw new UnauthorizedException('User not found.');
    const valid = await bcrypt.compare(currentPassword, full.password);
    if (!valid) throw new UnauthorizedException('Current password is incorrect.');
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(userId, hashed);
    return { message: 'Password changed successfully.' };
  }

  async resetPassword(otp: string, identifier: string, newPassword: string): Promise<{ message: string }> {
    const normalizedId = identifier.includes('@')
      ? identifier.trim().toLowerCase()
      : normalizePhoneForDatabase(identifier);

    // Scoped lookup — OTP only valid for the account that requested it (C2 fix)
    const user = await this.usersService.findByOtpAndIdentifier(otp, normalizedId);

    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      throw new UnauthorizedException('Invalid or expired reset code.');
    }

    if (new Date() > user.resetTokenExpiry) {
      await this.usersService.setResetToken(user.id, null, null);
      throw new UnauthorizedException('Reset code has expired. Please request a new one.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(user.id, hashedPassword);

    return { message: 'Password reset successfully.' };
  }

  private async generateTokens(userId: string, role: string) {
    const accessPayload = { sub: userId, role, type: 'access' };
    const refreshPayload = { sub: userId, role, type: 'refresh' };
    return {
      accessToken: this.jwtService.sign(accessPayload),
      refreshToken: this.jwtService.sign(refreshPayload, { expiresIn: '30d' }),
    };
  }
}
