import { registerAs } from '@nestjs/config';

export const yandexOAuthConfig = registerAs('yandexOAuth', () => ({
  clientId: process.env.YANDEX_CLIENT_ID ?? '',
  clientSecret: process.env.YANDEX_CLIENT_SECRET ?? '',
  callbackUrl:
    process.env.YANDEX_CALLBACK_URL ??
    'http://localhost:3000/api/auth/yandex/callback',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
}));
