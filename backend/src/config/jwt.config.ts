import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
  accessExpiresIn: Number(process.env.JWT_ACCESS_EXPIRES_IN ?? 3600),
  refreshExpiresIn: Number(process.env.JWT_REFRESH_EXPIRES_IN ?? 604800),
}));
