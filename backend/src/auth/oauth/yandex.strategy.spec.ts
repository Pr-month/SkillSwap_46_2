import { UnauthorizedException } from '@nestjs/common';
import { YandexStrategy } from './yandex.strategy';

describe('YandexStrategy', () => {
  const strategy = new YandexStrategy({
    clientId: 'client-id',
    clientSecret: 'client-secret',
    callbackUrl: 'http://localhost:3000/api/auth/yandex/callback',
    frontendUrl: 'http://localhost:5173',
  });

  it('converts a Yandex profile to an OAuth user', () => {
    const result = strategy.validate('', '', {
      id: 'yandex-user-id',
      displayName: 'Иван Иванов',
      emails: [{ value: 'USER@YANDEX.RU' }],
    });

    expect(result).toEqual({
      provider: 'yandex',
      providerId: 'yandex-user-id',
      email: 'user@yandex.ru',
      name: 'Иван Иванов',
    });
  });

  it('uses default_email from the raw profile', () => {
    const result = strategy.validate('', '', {
      id: 'yandex-user-id',
      _json: {
        default_email: 'user@yandex.ru',
        display_name: 'Иван',
      },
    });

    expect(result.email).toBe('user@yandex.ru');
    expect(result.name).toBe('Иван');
  });

  it('rejects a profile without an email', () => {
    expect(() =>
      strategy.validate('', '', {
        id: 'yandex-user-id',
      }),
    ).toThrow(UnauthorizedException);
  });
});
