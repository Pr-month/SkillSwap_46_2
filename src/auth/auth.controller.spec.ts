import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { Role } from '../shared/enums/role.enum';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { jwtConfig } from '../config/jwt.config';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    login: jest.Mock;
    register: jest.Mock;
    refreshFromPayload: jest.Mock;
    deleteRefreshToken: jest.Mock;
  };

  const authResult = {
    user: {
      id: 'a1b2c3',
      email: 'user@example.com',
      role: Role.USER,
      name: 'Test User',
    },
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  const createResponse = () => {
    const cookie = jest.fn();
    const clearCookie = jest.fn();
    return {
      res: { cookie, clearCookie } as unknown as Response,
      cookie,
      clearCookie,
    };
  };

  beforeEach(async () => {
    authService = {
      login: jest.fn().mockResolvedValue(authResult),
      register: jest.fn().mockResolvedValue(authResult),
      refreshFromPayload: jest.fn().mockResolvedValue(authResult),
      deleteRefreshToken: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
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

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('возвращает только { user } и ставит обе httpOnly-куки', async () => {
      const dto = { email: 'user@example.com', password: 'plain-password' };
      const { res, cookie } = createResponse();

      const result = await controller.login(dto, res);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ user: authResult.user });
      expect(cookie).toHaveBeenCalledWith('accessToken', 'access-token', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 3600 * 1000,
      });
      expect(cookie).toHaveBeenCalledWith('refreshToken', 'refresh-token', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 604800 * 1000,
      });
    });
  });

  describe('register', () => {
    it('возвращает только { user } и ставит обе httpOnly-куки', async () => {
      const dto = { name: 'Test', email: 'user@example.com', password: '123456' };
      const { res, cookie } = createResponse();

      const result = await controller.register(dto, res);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ user: authResult.user });
      expect(cookie).toHaveBeenCalledWith('accessToken', 'access-token', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 3600 * 1000,
      });
      expect(cookie).toHaveBeenCalledWith('refreshToken', 'refresh-token', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 604800 * 1000,
      });
    });
  });

  describe('refresh', () => {
    it('обновляет обе куки и возвращает { user }', async () => {
      const req = { user: { sub: 'a1b2c3' } } as any;
      const { res, cookie } = createResponse();

      const result = await controller.refresh(req, res);

      expect(authService.refreshFromPayload).toHaveBeenCalledWith(req);
      expect(result).toEqual({ user: authResult.user });
      expect(cookie).toHaveBeenCalledTimes(2);
    });
  });

  describe('logout', () => {
    it('чистит обе куки и удаляет refreshToken из БД', async () => {
      const req = { user: { sub: 'a1b2c3' } } as any;
      const { res, clearCookie } = createResponse();

      const result = await controller.logout(req, res);

      expect(authService.deleteRefreshToken).toHaveBeenCalledWith('a1b2c3');
      expect(clearCookie).toHaveBeenCalledWith('accessToken', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      });
      expect(clearCookie).toHaveBeenCalledWith('refreshToken', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      });
      expect(result).toEqual({ message: 'Выход выполнен успешно' });
    });
  });
});