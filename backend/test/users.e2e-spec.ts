import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request, { Response } from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Express } from 'express';
import { AllExceptionFilter } from '../src/common/filters/all-exception.filter';
import { Role } from '../src/shared/enums/role.enum';

type Headers = Record<string, string | string[] | undefined>;

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let server: Express;
  let userRepository: Repository<User>;

  const userData = {
    email: 'users-main@example.com',
    password: 'StrongP@ssw0rd',
  };
  const adminData = {
    email: 'users-admin@example.com',
    password: 'AdminP@ssw0rd',
  };
  const passUserData = {
    email: 'users-pass@example.com',
    password: 'PassUser@123',
  };

  const NON_EXISTENT_CITY = '00000000-0000-4000-8000-000000000000';

  let userToken = '';
  let adminToken = '';
  let passUserToken = '';

  const extractAccessToken = (res: { headers: Headers }): string | null => {
    const raw = res.headers['set-cookie'];
    if (!raw) return null;
    const cookies = Array.isArray(raw) ? raw : [raw];
    const accessCookie = cookies
      .map((cookie) => cookie.split(';')[0])
      .find((cookie) => cookie.startsWith('accessToken='));
    return accessCookie ? accessCookie.slice('accessToken='.length) : null;
  };

  const authTokenOf = async (
    user: { email: string; password: string },
  ): Promise<string> => {
    const res = await request(server)
      .post('/auth/register')
      .send(user)
      .expect(201);
    const token = extractAccessToken(res as { headers: Headers });
    if (!token) {
      throw new Error('Не удалось получить accessToken');
    }
    return token;
  };

  const loginTokenOf = async (
    user: { email: string; password: string },
  ): Promise<string> => {
    const res = await request(server)
      .post('/auth/login')
      .send(user)
      .expect(200);
    const token = extractAccessToken(res as { headers: Headers });
    if (!token) {
      throw new Error('Не удалось получить accessToken при входе');
    }
    return token;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new AllExceptionFilter());
    server = app.getHttpServer() as Express;
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );

    await app.init();

    userToken = await authTokenOf(userData);
    passUserToken = await authTokenOf(passUserData);

    // Админ создаётся напрямую (регистрация всегда создаёт роль USER)
    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    const admin = userRepository.create({
      email: adminData.email,
      password: hashedPassword,
      name: 'Test Admin',
      role: Role.ADMIN,
    });
    await userRepository.save(admin);

    adminToken = await loginTokenOf(adminData);
  });

  afterAll(async () => {
    if (userRepository) {
      await userRepository.delete({ email: userData.email });
      await userRepository.delete({ email: adminData.email });
      await userRepository.delete({ email: passUserData.email });
    }
    if (app) {
      await app.close();
    }
  });

  describe('GET /users/me', () => {
    it('возвращает 401 без токена', async () => {
      await request(server).get('/users/me').expect(401);
    });

    it('возвращает данные текущего пользователя (без пароля)', async () => {
      const res: Response = await request(server)
        .get('/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const body = res.body as {
        id?: string;
        email?: string;
        password?: unknown;
      };
      expect(body.id).toBeDefined();
      expect(body.email).toBe(userData.email);
      expect(body.password).toBeUndefined();
    });
  });

  describe('PATCH /users/me', () => {
    it('возвращает 401 без токена', async () => {
      await request(server)
        .patch('/users/me')
        .send({ name: 'Updated' })
        .expect(401);
    });

    it('обновляет имя пользователя', async () => {
      const newName = 'Обновлённое Имя';
      const res: Response = await request(server)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: newName })
        .expect(200);

      expect((res.body as { name?: string }).name).toBe(newName);
    });

    it('возвращает 400 для несуществующего cityId', async () => {
      await request(server)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ cityId: NON_EXISTENT_CITY })
        .expect(400);
    });
  });

  describe('PATCH /users/me/password', () => {
    it('возвращает 401 без токена', async () => {
      await request(server)
        .patch('/users/me/password')
        .send({ oldPassword: 'x', newPassword: 'y12345' })
        .expect(401);
    });

    it('возвращает 400 при неверном текущем пароле', async () => {
      await request(server)
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${passUserToken}`)
        .send({
          oldPassword: 'WrongPassword@1',
          newPassword: 'NewPass@12345',
        })
        .expect(400);
    });

    it('возвращает 400, если новый пароль совпадает со старым', async () => {
      await request(server)
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${passUserToken}`)
        .send({
          oldPassword: passUserData.password,
          newPassword: passUserData.password,
        })
        .expect(400);
    });

    it('успешно меняет пароль', async () => {
      const res: Response = await request(server)
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${passUserToken}`)
        .send({
          oldPassword: passUserData.password,
          newPassword: 'NewPass@12345',
        })
        .expect(200);

      expect((res.body as { message?: string }).message).toBeDefined();
    });
  });

  describe('GET /users (список)', () => {
    it('возвращает 401 без токена', async () => {
      await request(server).get('/users').expect(401);
    });

    it('возвращает 403 для обычного пользователя (не админ)', async () => {
      await request(server)
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('возвращает список пользователей для админа', async () => {
      const res: Response = await request(server)
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as {
        data: unknown[];
        page: number;
        totalPages: number;
      };
      expect(Array.isArray(body.data)).toBe(true);
      expect(typeof body.page).toBe('number');
      expect(typeof body.totalPages).toBe('number');
    });
  });
});