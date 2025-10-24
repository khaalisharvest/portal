import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    
    // Check if user account is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated');
    }
    
    // Update last login if it's been more than 1 hour since last update
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (!user.lastLoginAt || user.lastLoginAt < oneHourAgo) {
      await this.usersService.updateLastLogin(user.id);
    }
    
    return user;
  }
}
