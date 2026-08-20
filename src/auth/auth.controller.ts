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
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Вход пользователя в систему' })
  @ApiResponse({
    status: 200,
    description:
      'Успешный вход. Access и refresh токены устанавливаются в httpOnly cookies. Возвращается user',
  })
  @ApiResponse({
    status: 401,
    description: 'Не верный email или пароль',
  })
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
  @ApiCookieAuth('refreshToken')
  @ApiOperation({ summary: 'Обновление пары токенов' })
  @ApiResponse({
    status: 200,
    description: 'Токены обновлены и установлены в httpOnly cookies',
  })
  @ApiResponse({
    status: 401,
    description:
      'Refresh token отсутствует, невалиден или пользователь не авторизован',
  })
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
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Выход пользователя из системы' })
  @ApiResponse({
    status: 200,
    description:
      'Пользователь вышел из системы, токены удалены, cookies очищены',
  })
  @ApiResponse({
    status: 401,
    description: 'Пользователь не авторизован',
  })
  async logout(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.deleteRefreshToken(req.user.sub);
    this.clearAuthCookies(res);
    return { message: 'Выход выполнен успешно' };
  }

  @Post('register')
  @ApiOperation({ summary: 'Регистрация нового пользователя' })
  @ApiResponse({
    status: 201,
    description:
      'Пользователь создан. Access и refresh токены устанавливаются в httpOnly cookies. Возвращается user',
  })
  @ApiResponse({
    status: 400,
    description: 'Ошибка валидации или город с таким ID не найден',
  })
  @ApiResponse({
    status: 409,
    description: 'Пользователь с таким email уже существует',
  })
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
