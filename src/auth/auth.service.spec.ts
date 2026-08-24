import {
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
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
import { RegisterDto } from './dto/register.dto';

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
      p: RefreshPayloadInput,
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

class DuplicationKeyError extends Error {
  public code: string = '23505';
  constructor() {
    super('duplicate key');
    Object.setPrototypeOf(this, DuplicationKeyError.prototype);
  }
}

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

    it('бросает UnauthorizedException при не совпадающем refreshToken', async () => {
      mockedUserRepo.findOne.mockResolvedValue(existingUser);
      await expect(
        service.refreshFromPayloadPublic({
          user: {
            sub: existingUser.id,
            email: existingUser.email,
            role: existingUser.role,
            refreshToken: 'invalid-refresh-token',
          },
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('успешная регистрация нового пользователя', async () => {
      const dto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password',
        cityId: 'c1',
        about: 'about me',
        name: 'New User',
        birthdate: '1990-01-01',
      };

      const cityObj = {
        id: dto.cityId,
        name: 'City',
        region: 'Region',
      } as City;

      mockedUserRepo.findOne.mockResolvedValue(null);
      cityRepository.findOne.mockResolvedValue(cityObj);

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockedUserRepo.create.mockReturnValue({
        email: dto.email,
        password: 'hashed-password',
        city: cityObj,
        about: dto.about,
        name: dto.name,
        birthdate: new Date(dto.birthdate as string),
        role: Role.USER,
      } as unknown as User);

      mockedUserRepo.save
        .mockResolvedValueOnce({
          id: 'new-id',
          email: dto.email,
          city: cityObj,
          about: dto.about,
          name: dto.name,
          birthdate: new Date(dto.birthdate as string),
          role: Role.USER,
        } as unknown as User)
        .mockResolvedValueOnce({
          id: 'new-id',
          email: dto.email,
          city: cityObj,
          about: dto.about,
          name: dto.name,
          birthdate: new Date(dto.birthdate as string),
          role: Role.USER,
        } as unknown as User);

      const result = await service.register(dto);

      expect(result.user).toBeDefined();
      expect(result.user.id).toBe('new-id');
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(mockedUserRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ refreshToken: 'refresh-token' }),
      );
    });

    it('бросает BadRequestException, если город по указанному id не найден', async () => {
      const dto: RegisterDto = {
        email: 'user2@example.com',
        password: 'password',
        cityId: 'missing-city',
        about: 'about me',
        name: 'User Two',
        birthdate: '1995-05-05',
      };

      mockedUserRepo.findOne.mockResolvedValue(null);
      cityRepository.findOne.mockResolvedValue(null);

      await expect(service.register(dto)).rejects.toThrow(BadRequestException);
    });

    it('бросает InternalServerErrorException при дублировании email (23505)', async () => {
      const dto: RegisterDto = {
        email: 'existing@example.com',
        password: 'password',
        cityId: 'c1',
        about: 'about me',
        name: 'Existing User',
        birthdate: '1992-02-02',
      };

      const cityObj = {
        id: dto.cityId,
        name: 'City',
        region: 'Region',
      } as City;

      mockedUserRepo.findOne.mockResolvedValue(null);
      cityRepository.findOne.mockResolvedValue(cityObj);

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockedUserRepo.create.mockReturnValue({
        email: dto.email,
        password: 'hashed-password',
        city: cityObj,
        about: dto.about,
        name: dto.name,
        birthdate: new Date(dto.birthdate as string),
        role: Role.USER,
      } as unknown as User);

      const dupError = new DuplicationKeyError();
      mockedUserRepo.save.mockRejectedValue(dupError);

      await expect(service.register(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('deleteRefreshToken', () => {
    it('устанавливает refreshToken=null у найденного пользователя', async () => {
      mockedUserRepo.findOne.mockResolvedValue({
        ...existingUser,
        refreshToken: 'refresh-token',
      } as unknown as User);

      await service.deleteRefreshToken(existingUser.id);

      expect(mockedUserRepo.save).toHaveBeenCalledWith({
        ...existingUser,
        refreshToken: null,
      });
    });
  });
});
