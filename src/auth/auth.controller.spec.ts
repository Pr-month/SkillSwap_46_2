import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { Role } from '../shared/enums/role.enum';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthResult } from './auth.types';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: { login: jest.Mock };

  const authResult: AuthResult = {
    user: { id: 'a1b2c3', email: 'user@example.com', role: Role.USER },
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  // Держим ссылку на мок отдельно: обращение к res.cookie в expect()
  // запрещено правилом @typescript-eslint/unbound-method.
  const createResponse = () => {
    const cookie = jest.fn();
    return { res: { cookie } as unknown as Response, cookie };
  };

  beforeEach(async () => {
    authService = { login: jest.fn().mockResolvedValue(authResult) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('передаёт учётные данные в сервис и возвращает его результат', async () => {
      const dto = { email: 'user@example.com', password: 'plain-password' };

      const result = await controller.login(dto, createResponse().res);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(authResult);
    });

    it('кладёт access-токен в httpOnly cookie', async () => {
      const { res, cookie } = createResponse();

      await controller.login(
        { email: 'user@example.com', password: 'plain-password' },
        res,
      );

      expect(cookie).toHaveBeenCalledWith('accessToken', 'access-token', {
        httpOnly: true,
        sameSite: 'lax',
      });
    });
  });
});
