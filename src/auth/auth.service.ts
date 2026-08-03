import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { jwtConfig } from '../config/jwt.config';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  create(createAuthDto: CreateAuthDto) {
    void createAuthDto;

    return 'This action adds a new auth';
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    void updateAuthDto;

    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }

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

  async refreshFromPayload(userPayload: JwtPayload) {
    const user = await this.usersService.findById(userPayload.sub);

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
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
