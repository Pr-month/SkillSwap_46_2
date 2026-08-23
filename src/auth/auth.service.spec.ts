import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { jwtConfig } from '../config/jwt.config';
import { Role } from '../shared/enums/role.enum';
import { User } from '../users/entities/user.entity';
import { City } from '../cities/entities/city.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { appConfig } from '../config/app.config';

jest.mock('bcrypt');

const bcryptCompare = bcrypt.compare as unknown as jest.MockedFunction<
  (data: string, encrypted: string) => Promise<boolean>
>;

type RefreshPayloadInput = {
  user: {
    sub: string;
    email: string;
    role: Role;
    refreshToken?: string;
  };
};

type TestUser = {
  id: string;
  email: string;
  password: string;
  role: Role;
  refreshToken?: string;
};

class PublicAuthService extends (AuthService as unknown as {
  new (): AuthService;
}) {
  public refreshFromPayloadPublic = (
    payload: RefreshPayloadInput,
  ): Promise<{ accessToken: string; refreshToken: string }> => {
    type RefreshFromPayloadFn = (
      this: AuthService,
      p: RefreshPayloadInput,
    ) => Promise<{
      accessToken: string;
      refreshToken: string;
    }>;

    const fn = (this as unknown as { refreshFromPayload: RefreshFromPayloadFn })
      .refreshFromPayload;

    const bound = fn.bind(this) as (
      p: RefreshPayloadInput
    ) => Promise<{ accessToken: string; refreshToken: string }>;

    return bound(payload);
  };
}

type MockUserRepository = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
};

type MockCityRepository = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
};

describe('AuthService', () => {
  let service: PublicAuthService;
  let mockedUserRepo: MockUserRepository;
  let cityRepository: MockCityRepository;

  const existingUser: TestUser = {
    id: 'a1b2c3',
    email: 'user@example.com',
    password: 'hashed-password',
    role: Role.USER,
    refreshToken: 'refresh-token',
  };

  beforeEach(async () => {
    mockedUserRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    cityRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicAuthService,
        { provide: getRepositoryToken(User), useValue: mockedUserRepo },
        { provide: getRepositoryToken(City), useValue: cityRepository },
        {
          provide: JwtService,
          useValue: {
            sign: jest
              .fn()
              .mockReturnValueOnce('access-token')
              .mockReturnValueOnce('refresh-token'),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: appConfig.KEY,
          useValue: {
            hashSalt: 10,
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

    service = module.get<PublicAuthService>(PublicAuthService);
    mockedUserRepo = module.get<MockUserRepository>(getRepositoryToken(User));
    cityRepository = module.get<MockCityRepository>(getRepositoryToken(City));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('возвращает пользователя и пару токенов при верных учётных данных', async () => {
      mockedUserRepo.findOne.mockResolvedValue(existingUser);
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
      mockedUserRepo.findOne.mockResolvedValue(existingUser);
      bcryptCompare.mockResolvedValue(true);

      await service.login({
        email: existingUser.email,
        password: 'plain-password',
      });

      expect(mockedUserRepo.save).toHaveBeenCalledWith({
        ...existingUser,
        refreshToken: 'refresh-token',
      });
    });

    it('бросает UnauthorizedException, если пользователь не найден', async () => {
      mockedUserRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'no@example.com', password: 'plain-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('бросает UnauthorizedException при неверном пароле', async () => {
      mockedUserRepo.findOne.mockResolvedValue(existingUser);
      bcryptCompare.mockResolvedValue(false);

      await expect(
        service.login({ email: existingUser.email, password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshFromPayload', () => {
    it('выдаёт новую пару токенов существующему пользователю', async () => {
      mockedUserRepo.findOne.mockResolvedValue(existingUser);

      const result = await service.refreshFromPayloadPublic({
        user: {
          sub: existingUser.id,
          email: existingUser.email,
          role: existingUser.role,
          refreshToken: 'refresh-token',
        },
      });

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(mockedUserRepo.save).toHaveBeenCalledWith({
        ...existingUser,
        refreshToken: 'refresh-token',
      });
    });

    it('бросает UnauthorizedException, если пользователь не найден', async () => {
      mockedUserRepo.findOne.mockResolvedValue(null);

      await expect(
        service.refreshFromPayloadPublic({
          user: {
            sub: 'unknown',
            email: 'no@example.com',
            role: Role.USER,
            refreshToken: 'refresh-token',
          },
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});