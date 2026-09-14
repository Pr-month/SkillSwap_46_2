import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy as PassportYandexStrategy } from 'passport-yandex';
import { yandexOAuthConfig } from '../../config/yandex-oauth.config';
import { OAuthUser } from './oauth.types';

@Injectable()
export class YandexStrategy extends PassportStrategy(
  PassportYandexStrategy,
  'yandex',
) {
  constructor(
    @Inject(yandexOAuthConfig.KEY)
    config: ConfigType<typeof yandexOAuthConfig>,
  ) {
    super({
      clientID: config.clientId || 'not-configured',
      clientSecret: config.clientSecret || 'not-configured',
      callbackURL: config.callbackUrl,
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): OAuthUser {
    const email = profile.emails?.[0]?.value ?? profile._json?.default_email;

    if (!email) {
      throw new UnauthorizedException(
        'Яндекс не предоставил email пользователя',
      );
    }

    return {
      provider: 'yandex',
      providerId: profile.id,
      email: email.toLowerCase(),
      name:
        profile.displayName ??
        profile._json?.display_name ??
        profile._json?.real_name ??
        null,
    };
  }
}
