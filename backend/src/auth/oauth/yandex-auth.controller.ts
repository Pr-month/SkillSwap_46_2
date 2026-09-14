import {
  Controller,
  Get,
  Inject,
  Req,
  Res,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from '../auth.service';
import { RequestWithOAuthUser } from '../auth.types';
import { jwtConfig } from '../../config/jwt.config';
import { yandexOAuthConfig } from '../../config/yandex-oauth.config';

@Controller('auth/yandex')
export class YandexAuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    @Inject(yandexOAuthConfig.KEY)
    private readonly yandexConfiguration: ConfigType<typeof yandexOAuthConfig>,
  ) {}

  @Get()
  @UseGuards(AuthGuard('yandex'))
  login(): void {
    this.ensureConfigured();
  }

  @Get('callback')
  @UseGuards(AuthGuard('yandex'))
  async callback(
    @Req() req: RequestWithOAuthUser,
    @Res() res: Response,
  ): Promise<void> {
    this.ensureConfigured();

    const result = await this.authService.loginWithOAuth(req.user);

    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    res.redirect(`${this.yandexConfiguration.frontendUrl}/login?oauth=success`);
  }

  private ensureConfigured(): void {
    if (
      !this.yandexConfiguration.clientId ||
      !this.yandexConfiguration.clientSecret
    ) {
      throw new ServiceUnavailableException(
        'Авторизация через Яндекс не настроена',
      );
    }
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
}
