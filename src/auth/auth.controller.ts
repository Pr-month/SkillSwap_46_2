import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { jwtConfig } from '../config/jwt.config';
import { AccessTokenGuard } from './guards/accessToken.guard';
import { RefreshTokenGuard } from './guards/refreshToken.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import {
  JwtPayload,
  RequestWithRefreshToken,
  RequestWithUser,
} from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Role } from '../shared/enums/role.enum';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshTokenGuard, RolesGuard)
  @Roles([Role.ADMIN, Role.USER])
  async refresh(
    @Req() req: RequestWithRefreshToken,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Пользователь не авторизован');
    }
    const result = await this.authService.refreshFromPayload(req);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles([Role.USER, Role.ADMIN])
  async logout(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.deleteRefreshToken(req.user.sub);
    this.clearAuthCookies(res);
    return { message: 'Выход выполнен успешно' };
  }

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: this.jwtConfiguration.accessExpiresIn * 1000,
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: this.jwtConfiguration.refreshExpiresIn * 1000,
    });
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie('accessToken', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
  }
}
