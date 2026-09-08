import {
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { CategoriesController } from '../src/categories/categories.controller';
import { CategoriesService } from '../src/categories/categories.service';
import { AccessTokenGuard } from '../src/auth/guards/accessToken.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { AccessTokenStrategy } from '../src/auth/strategies/accessToken.strategy';
import { jwtConfig } from '../src/config/jwt.config';
import { Role } from '../src/shared/enums/role.enum';

describe('CategoriesController (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;

  const accessSecret = 'categories-e2e-access-secret';
  const refreshSecret = 'categories-e2e-refresh-secret';
  const accessExpiresIn = 3600;
  const refreshExpiresIn = 604800;

  const rootCategory = {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Творчество',
    parent: null,
    children: [
      {
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Музыка',
        parent: null,
        children: [],
      },
    ],
  };

  const categoriesService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const createToken = (role: Role): string =>
    jwtService.sign(
      {
        sub: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        email: `${role.toLowerCase()}@example.com`,
        role,
      },
      {
        secret: accessSecret,
        expiresIn: accessExpiresIn,
      },
    );

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: categoriesService,
        },
        AccessTokenGuard,
        RolesGuard,
        AccessTokenStrategy,
        {
          provide: jwtConfig.KEY,
          useValue: {
            accessSecret,
            accessExpiresIn,
            refreshSecret,
            refreshExpiresIn,
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
        forbidUnknownValues: true,
      }),
    );

    jwtService = new JwtService();
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/categories', () => {
    it('returns root categories with children', async () => {
      categoriesService.findAll.mockResolvedValue([rootCategory]);

      const response = await request(app.getHttpServer())
        .get('/api/categories')
        .expect(200);

      expect(response.body).toEqual([rootCategory]);
      expect(categoriesService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/categories/:id', () => {
    it('returns category by id', async () => {
      categoriesService.findOne.mockResolvedValue(rootCategory);

      const response = await request(app.getHttpServer())
        .get(`/api/categories/${rootCategory.id}`)
        .expect(200);

      expect(response.body).toEqual(rootCategory);
      expect(categoriesService.findOne).toHaveBeenCalledWith(rootCategory.id);
    });

    it('returns 404 for unknown category', async () => {
      categoriesService.findOne.mockRejectedValue(
        new NotFoundException('Категория не найдена'),
      );

      await request(app.getHttpServer())
        .get('/api/categories/33333333-3333-4333-8333-333333333333')
        .expect(404);
    });

    it('returns 400 for invalid uuid', async () => {
      await request(app.getHttpServer())
        .get('/api/categories/not-a-uuid')
        .expect(400);

      expect(categoriesService.findOne).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/categories', () => {
    it('returns 401 without access token', async () => {
      await request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: 'Новая категория' })
        .expect(401);

      expect(categoriesService.create).not.toHaveBeenCalled();
    });

    it('returns 403 for regular user', async () => {
      const userToken = createToken(Role.USER);

      await request(app.getHttpServer())
        .post('/api/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Новая категория' })
        .expect(403);

      expect(categoriesService.create).not.toHaveBeenCalled();
    });

    it('creates category for admin', async () => {
      const adminToken = createToken(Role.ADMIN);
      const createdCategory = {
        ...rootCategory,
        id: '44444444-4444-4444-8444-444444444444',
        name: 'Новая категория',
        children: [],
      };

      categoriesService.create.mockResolvedValue(createdCategory);

      const response = await request(app.getHttpServer())
        .post('/api/categories')
        .set('Cookie', [`accessToken=${adminToken}`])
        .send({ name: 'Новая категория' })
        .expect(201);

      expect(response.body).toEqual(createdCategory);
      expect(categoriesService.create).toHaveBeenCalledWith({
        name: 'Новая категория',
      });
    });

    it('returns 400 for invalid dto', async () => {
      const adminToken = createToken(Role.ADMIN);

      await request(app.getHttpServer())
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '' })
        .expect(400);

      expect(categoriesService.create).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /api/categories/:id', () => {
    it('returns 403 for regular user', async () => {
      const userToken = createToken(Role.USER);

      await request(app.getHttpServer())
        .patch(`/api/categories/${rootCategory.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Обновлённая категория' })
        .expect(403);

      expect(categoriesService.update).not.toHaveBeenCalled();
    });

    it('updates category for admin', async () => {
      const adminToken = createToken(Role.ADMIN);
      const updatedCategory = {
        ...rootCategory,
        name: 'Обновлённая категория',
      };

      categoriesService.update.mockResolvedValue(updatedCategory);

      const response = await request(app.getHttpServer())
        .patch(`/api/categories/${rootCategory.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Обновлённая категория' })
        .expect(200);

      expect(response.body).toEqual(updatedCategory);
      expect(categoriesService.update).toHaveBeenCalledWith(rootCategory.id, {
        name: 'Обновлённая категория',
      });
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('returns 403 for regular user', async () => {
      const userToken = createToken(Role.USER);

      await request(app.getHttpServer())
        .delete(`/api/categories/${rootCategory.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(categoriesService.remove).not.toHaveBeenCalled();
    });

    it('deletes category for admin', async () => {
      const adminToken = createToken(Role.ADMIN);

      categoriesService.remove.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete(`/api/categories/${rootCategory.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      expect(categoriesService.remove).toHaveBeenCalledWith(rootCategory.id);
    });

    it('returns 401 without access token', async () => {
      await request(app.getHttpServer())
        .delete(`/api/categories/${rootCategory.id}`)
        .expect(401);

      expect(categoriesService.remove).not.toHaveBeenCalled();
    });
  });
});
