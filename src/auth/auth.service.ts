import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { jwtConfig } from '../config/jwt.config';
import { UsersService } from '../users/users.service';
import { JwtPayload, RequestWithRefreshToken } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  async deleteRefreshToken(userId: string): Promise<void> {
    await this.usersService.clearRefreshToken(userId);
  }

  private generateTokens(user: JwtPayload) {
    const payload = { sub: user.sub, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.jwtConfiguration.accessSecret,
      expiresIn: this.jwtConfiguration.accessExpiresIn,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.jwtConfiguration.refreshSecret,
      expiresIn: this.jwtConfiguration.refreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  async refreshFromPayload(userPayload: RequestWithRefreshToken) {
    const user = await this.usersService.findByIdWithRefreshToken(userPayload.user.sub);

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    if (userPayload.user.refreshToken !== user.refreshToken) {
      throw new UnauthorizedException('Неверный refreshToken');
    }

    const { accessToken, refreshToken: newRefreshToken } = this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    await this.usersService.updateRefreshToken(user.id, newRefreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken: newRefreshToken,
    };
  }
}
