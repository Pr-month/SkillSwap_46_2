import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: Number(process.env.PORT) || 3000,
  hashSalt: Number(process.env.HASH_SALT) || 10,
}));
