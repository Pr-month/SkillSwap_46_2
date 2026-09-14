import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { AuthService } from '../auth.service';
import { User } from '../../users/entities/user.entity';
import { City } from '../../cities/entities/city.entity';
import { Role } from '../../shared/enums/role.enum';

describe('AuthService OAuth', () => {
  const jwtConfiguration = {
    accessSecret: 'access-secret',
    refreshSecret: 'refresh-secret',
    accessExpiresIn: 3600,
    refreshExpiresIn: 604800,
  };

  const createService = (
    userRepository: Partial<Repository<User>>,
    jwtService: Partial<JwtService>,
  ) =>
    new AuthService(
      userRepository as Repository<User>,
      {} as Repository<City>,
      jwtService as JwtService,
      jwtConfiguration,
    );

  it('issues application tokens for an existing user', async () => {
    const user: User = {
      id: 'user-id',
      email: 'user@yandex.ru',
      name: 'Иван',
      role: Role.USER,
      refreshToken: null,
    } as User;

    const userRepository: Partial<Repository<User>> = {
      findOne: jest.fn().mockResolvedValue(user),
      save: jest.fn().mockImplementation((value) => Promise.resolve(value)),
    };

    const jwtService: Partial<JwtService> = {
      sign: jest
        .fn()
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token'),
    };

    const service = createService(userRepository, jwtService);

    const result = await service.loginWithOAuth({
      provider: 'yandex',
      providerId: 'yandex-id',
      email: 'user@yandex.ru',
      name: 'Иван',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.user.email).toBe('user@yandex.ru');
    expect(userRepository.create).toBeUndefined();
    expect(userRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ refreshToken: 'refresh-token' }),
    );
  });

  it('creates a user when the email is new', async () => {
    const createdUser: User = {
      id: 'new-user-id',
      email: 'new@yandex.ru',
      name: 'Новый пользователь',
      password: 'hashed-password',
      role: Role.USER,
      refreshToken: null,
    } as User;

    const userRepository: Partial<Repository<User>> = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue(createdUser),
      save: jest.fn().mockImplementation((value) => Promise.resolve(value)),
    };

    const jwtService: Partial<JwtService> = {
      sign: jest
        .fn()
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token'),
    };

    const service = createService(userRepository, jwtService);

    const result = await service.loginWithOAuth({
      provider: 'yandex',
      providerId: 'yandex-id',
      email: 'new@yandex.ru',
      name: 'Новый пользователь',
    });

    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new@yandex.ru',
        name: 'Новый пользователь',
        role: Role.USER,
      }),
    );
    expect(result.user.id).toBe('new-user-id');
  });
});
