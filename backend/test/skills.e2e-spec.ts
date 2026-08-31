import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request, { Response } from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/entities/user.entity';
import { Category } from '../src/categories/entities/category.entity';
import { Skill } from '../src/skills/entities/skill.entity';
import { Repository } from 'typeorm';
import { Express } from 'express';
import { AllExceptionFilter } from '../src/common/filters/all-exception.filter';

type Headers = Record<string, string | string[] | undefined>;

describe('SkillsController (e2e)', () => {
  let app: INestApplication;
  let server: Express;
  let userRepository: Repository<User>;
  let categoryRepository: Repository<Category>;
  let skillsRepository: Repository<Skill>;

  const owner = {
    email: 'skills-owner@example.com',
    password: 'StrongP@ssw0rd',
  };
  const other = {
    email: 'skills-other@example.com',
    password: 'StrongP@ssw0rd',
  };

  let tokenOwner = '';
  let tokenOther = '';
  let categoryId = '';
  const createdSkillIds: string[] = [];

  const NON_EXISTENT_CATEGORY = '00000000-0000-4000-8000-000000000000';

  const extractAccessToken = (res: { headers: Headers }): string | null => {
    const raw = res.headers['set-cookie'];
    if (!raw) return null;
    const cookies = Array.isArray(raw) ? raw : [raw];
    const accessCookie = cookies
      .map((cookie) => cookie.split(';')[0])
      .find((cookie) => cookie.startsWith('accessToken='));
    return accessCookie ? accessCookie.slice('accessToken='.length) : null;
  };

  const register = async (
    user: { email: string; password: string },
  ): Promise<string> => {
    const res = await request(server)
      .post('/auth/register')
      .send(user)
      .expect(201);
    const token = extractAccessToken(res as { headers: Headers });
    if (!token) {
      throw new Error('Не удалось получить accessToken после регистрации');
    }
    return token;
  };

  const createSkill = async (
    token: string,
    title: string,
  ): Promise<Response> => {
    const res: Response = await request(server)
      .post('/skills')
      .set('Authorization', `Bearer ${token}`)
      .send({ title, categoryId })
      .expect(201);
    const body = res.body as { id?: string };
    if (body.id) {
      createdSkillIds.push(body.id);
    }
    return res;
  };

  const skillIdOf = (res: Response): string => {
    const body = res.body as { id: string };
    return body.id;
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
    categoryRepository = moduleFixture.get<Repository<Category>>(
      getRepositoryToken(Category),
    );
    skillsRepository = moduleFixture.get<Repository<Skill>>(
      getRepositoryToken(Skill),
    );

    await app.init();

    tokenOwner = await register(owner);
    tokenOther = await register(other);

    const category = categoryRepository.create({ name: 'TestCategoryE2E' });
    const savedCategory = await categoryRepository.save(category);
    categoryId = savedCategory.id;
  });

  afterAll(async () => {
    for (const id of createdSkillIds) {
      await skillsRepository.delete(id);
    }
    if (categoryId) {
      await categoryRepository.delete(categoryId);
    }
    if (userRepository) {
      await userRepository.delete({ email: owner.email });
      await userRepository.delete({ email: other.email });
    }
    if (app) {
      await app.close();
    }
  });

  describe('GET /skills', () => {
    it('возвращает структуру пагинации', async () => {
      const res: Response = await request(server).get('/skills').expect(200);
      const body = res.body as {
        data: unknown[];
        page: number;
        totalPages: number;
      };
      expect(Array.isArray(body.data)).toBe(true);
      expect(typeof body.page).toBe('number');
      expect(typeof body.totalPages).toBe('number');
    });

    it('фильтрует по search', async () => {
      const title = 'ZetaSearchableSkill';
      await createSkill(tokenOwner, title);
      const res: Response = await request(server)
        .get('/skills')
        .query({ search: 'ZetaSearchable' })
        .expect(200);
      const body = res.body as { data: Array<{ title?: string }> };
      const found = body.data.some((skill) => skill.title === title);
      expect(found).toBe(true);
    });
  });

  describe('POST /skills', () => {
    it('возвращает 401 без токена', async () => {
      await request(server)
        .post('/skills')
        .send({ title: 'NoTokenSkill', categoryId })
        .expect(401);
    });

    it('создаёт навык с валидной категорией', async () => {
      const res = await createSkill(tokenOwner, 'CreateOwnerSkill');
      const body = res.body as { id?: string; title?: string };
      expect(body.title).toBe('CreateOwnerSkill');
      expect(body.id).toBeDefined();
    });

    it('возвращает 404 для несуществующей категории', async () => {
      await request(server)
        .post('/skills')
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ title: 'NoCategorySkill', categoryId: NON_EXISTENT_CATEGORY })
        .expect(404);
    });
  });

  describe('PATCH /skills/:id', () => {
    it('возвращает 401 без токена', async () => {
      const created = await createSkill(tokenOwner, 'PatchNoTokenSkill');
      await request(server)
        .patch(`/skills/${skillIdOf(created)}`)
        .send({ title: 'Updated' })
        .expect(401);
    });

    it('владелец может обновить навык', async () => {
      const created = await createSkill(tokenOwner, 'PatchOwnerSkill');
      const res: Response = await request(server)
        .patch(`/skills/${skillIdOf(created)}`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ title: 'PatchOwnerSkillUpdated' })
        .expect(200);
      expect((res.body as { title?: string }).title).toBe(
        'PatchOwnerSkillUpdated',
      );
    });

    it('возвращает 403 для чужого навыка', async () => {
      const created = await createSkill(tokenOwner, 'PatchOtherSkill');
      await request(server)
        .patch(`/skills/${skillIdOf(created)}`)
        .set('Authorization', `Bearer ${tokenOther}`)
        .send({ title: 'Hacked' })
        .expect(403);
    });
  });

  describe('DELETE /skills/:id', () => {
    it('возвращает 401 без токена', async () => {
      const created = await createSkill(tokenOwner, 'DeleteNoTokenSkill');
      await request(server)
        .delete(`/skills/${skillIdOf(created)}`)
        .expect(401);
    });

    it('владелец может удалить навык', async () => {
      const created = await createSkill(tokenOwner, 'DeleteOwnerSkill');
      const res: Response = await request(server)
        .delete(`/skills/${skillIdOf(created)}`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .expect(200);
      expect((res.body as { message?: string }).message).toBeDefined();
    });

    it('возвращает 403 для чужого навыка', async () => {
      const created = await createSkill(tokenOwner, 'DeleteOtherSkill');
      await request(server)
        .delete(`/skills/${skillIdOf(created)}`)
        .set('Authorization', `Bearer ${tokenOther}`)
        .expect(403);
    });
  });

  describe('избранное /skills/:id/favorite', () => {
    it('возвращает 401 без токена', async () => {
      const created = await createSkill(tokenOwner, 'FavNoTokenSkill');
      await request(server)
        .post(`/skills/${skillIdOf(created)}/favorite`)
        .expect(401);
    });

    it('добавляет в избранное, повторное добавление — 409', async () => {
      const created = await createSkill(tokenOwner, 'FavDuplicateSkill');
      const id = skillIdOf(created);
      await request(server)
        .post(`/skills/${id}/favorite`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .expect(201);
      await request(server)
        .post(`/skills/${id}/favorite`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .expect(409);
    });

    it('удаляет из избранного, повторное удаление — 404', async () => {
      const created = await createSkill(tokenOther, 'FavRemoveSkill');
      const id = skillIdOf(created);
      await request(server)
        .post(`/skills/${id}/favorite`)
        .set('Authorization', `Bearer ${tokenOther}`)
        .expect(201);
      await request(server)
        .delete(`/skills/${id}/favorite`)
        .set('Authorization', `Bearer ${tokenOther}`)
        .expect(200);
      await request(server)
        .delete(`/skills/${id}/favorite`)
        .set('Authorization', `Bearer ${tokenOther}`)
        .expect(404);
    });
  });
});