import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { jwtConfig } from '../config/jwt.config';
import { Role } from '../shared/enums/role.enum';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt');

// bcrypt.compare перегружен (промис + колбэк), поэтому сужаем тип мока
// до промис-варианта, который реально использует AuthService.
const bcryptCompare = bcrypt.compare as jest.MockedFunction<
  (data: string, encrypted: string) => Promise<boolean>
>;

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findByEmailWithPassword: jest.Mock;
    findById: jest.Mock;
    updateRefreshToken: jest.Mock;
    clearRefreshToken: jest.Mock;
  };

  const existingUser = {
    id: 'a1b2c3',
    email: 'user@example.com',
    password: 'hashed-password',
    role: Role.USER,
  } as User;

  beforeEach(async () => {
    usersService = {
      findByEmailWithPassword: jest.fn(),
      findById: jest.fn(),
      updateRefreshToken: jest.fn().mockResolvedValue(undefined),
      clearRefreshToken: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        {
          provide: JwtService,
          useValue: {
            sign: jest
              .fn()
              .mockReturnValueOnce('access-token')
              .mockReturnValueOnce('refresh-token'),
          },
        },
        {
          provide: jwtConfig.KEY,
          useValue: {
            accessSecret: 'access-secret',
            refreshSecret: 'refresh-secret',
            accessExpiresIn: 3600,
            refreshExpiresIn: 604800,
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('возвращает пользователя и пару токенов при верных учётных данных', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(existingUser);
      bcryptCompare.mockResolvedValue(true);

      const result = await service.login({
        email: existingUser.email,
        password: 'plain-password',
      });

      expect(result).toEqual({
        user: {
          id: existingUser.id,
          email: existingUser.email,
          role: existingUser.role,
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(bcryptCompare).toHaveBeenCalledWith(
        'plain-password',
        existingUser.password,
      );
    });

    it('сохраняет выданный refresh-токен пользователю', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(existingUser);
      bcryptCompare.mockResolvedValue(true);

      await service.login({
        email: existingUser.email,
        password: 'plain-password',
      });

      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        existingUser.id,
        'refresh-token',
      );
    });

    it('бросает UnauthorizedException, если пользователь не найден', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        service.login({ email: 'no@example.com', password: 'plain-password' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(usersService.updateRefreshToken).not.toHaveBeenCalled();
    });

    it('бросает UnauthorizedException при неверном пароле', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(existingUser);
      bcryptCompare.mockResolvedValue(false);

      await expect(
        service.login({ email: existingUser.email, password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(usersService.updateRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('refreshFromPayload', () => {
    it('выдаёт новую пару токенов существующему пользователю', async () => {
      usersService.findById.mockResolvedValue(existingUser);

      const result = await service.refreshFromPayload({
        sub: existingUser.id,
        email: existingUser.email,
        role: existingUser.role,
      });

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        existingUser.id,
        'refresh-token',
      );
    });

    it('бросает UnauthorizedException, если пользователь не найден', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(
        service.refreshFromPayload({
          sub: 'unknown',
          email: 'no@example.com',
          role: Role.USER,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
