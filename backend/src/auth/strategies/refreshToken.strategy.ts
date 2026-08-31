import { Inject, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConfig } from '../../config/jwt.config';
import { JwtPayload } from '../auth.types';

const extractRefreshToken = (req: Request): string | null => {
  const cookies = (req.cookies ?? {}) as Record<string, string>;
  return cookies.refreshToken ?? null;
};

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    @Inject(jwtConfig.KEY)
    config: ConfigType<typeof jwtConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        extractRefreshToken,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.refreshSecret,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayload) {
    return {
      ...payload,
      refreshToken: extractRefreshToken(req),
    };
  }
}
