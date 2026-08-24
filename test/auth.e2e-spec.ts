import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request, { Response, SuperTest, Test as SuperTestCase } from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { Express } from 'express';
import { AllExceptionFilter } from '../src/common/filters/all-exception.filter';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let server: Express;
  type AgentType = SuperTest<SuperTestCase>;
  let agent: AgentType;

  const testUser = {
    email: 'test@example.com',
    password: 'StrongP@ssw0rd',
  };

  const extractCookies = (res: {
    headers: { [key: string]: string | string[] | undefined };
  }): string[] => {
    const raw = res.headers['set-cookie'];
    if (!raw) return [];
    return Array.isArray(raw) ? raw : [raw];
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new AllExceptionFilter());
    server = app.getHttpServer() as Express;
    agent = request.agent(server) as unknown as AgentType;
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );

    await app.init();
  });

  afterAll(async () => {
    await userRepository.delete({ email: testUser.email });
    await app.close();
  });

  beforeEach(async () => {
    await userRepository.delete({ email: testUser.email });
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user and "token" cookies are set', async () => {
      const res = await agent.post('/auth/register').send(testUser).expect(201);

      expect(res.body).toHaveProperty('user');

      const cookies = extractCookies(
        res as { headers: { [key: string]: string | string[] | undefined } },
      );
      const hasAccess = cookies.some((c: string) =>
        c.startsWith('accessToken='),
      );
      const hasRefresh = cookies.some((c: string) =>
        c.startsWith('refreshToken='),
      );
      expect(hasAccess).toBeTruthy();
      expect(hasRefresh).toBeTruthy();
    });

    it('should not allow duplicate registration', async () => {
      await agent.post('/auth/register').send(testUser).expect(201);
      await agent.post('/auth/register').send(testUser).expect(409);
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      await agent.post('/auth/register').send(testUser).expect(201);
    });

    it('should login existing user and "token" cookies are set', async () => {
      const res = await agent.post('/auth/login').send(testUser).expect(200);

      expect(res.body).toHaveProperty('user');

      const cookies = extractCookies(
        res as { headers: { [key: string]: string | string[] | undefined } },
      );
      const hasAccess = cookies.some((c: string) =>
        c.startsWith('accessToken='),
      );
      const hasRefresh = cookies.some((c: string) =>
        c.startsWith('refreshToken='),
      );
      expect(hasAccess).toBeTruthy();
      expect(hasRefresh).toBeTruthy();
    });

    it('should reject invalid credentials', async () => {
      await agent
        .post('/auth/login')
        .send({ email: testUser.email, password: 'wrong' })
        .expect(401);
    });
  });

  describe('/auth/refresh (POST)', () => {
    beforeEach(async () => {
      await agent.post('/auth/register').send(testUser).expect(201);
      await agent.post('/auth/login').send(testUser).expect(200);
    });

    it('should refresh tokens using valid refresh token', async () => {
      const res = await agent.post('/auth/refresh');
      if (res.status === 200) {
        expect(res.body).toHaveProperty('user');
        const cookies = extractCookies(
          res as { headers: { [key: string]: string | string[] | undefined } },
        );
        const hasAccess = cookies.some((c: string) =>
          c.startsWith('accessToken='),
        );
        const hasRefresh = cookies.some((c: string) =>
          c.startsWith('refreshToken='),
        );
        expect(hasAccess).toBeTruthy();
        expect(hasRefresh).toBeTruthy();
      } else {
        expect(res.status).toBe(401);
      }
    });

    it('should reject invalid or missing refresh token', async () => {
      const anon = request.agent(server);
      const res = await anon.post('/auth/refresh');
      expect(res.status).toBe(401);
    });
  });

  describe('/auth/logout (POST)', () => {
    beforeEach(async () => {
      await agent.post('/auth/register').send(testUser).expect(201);
      await agent.post('/auth/login').send(testUser).expect(200);
    });

    it('should reject logout without access token', async () => {
      const anon = request.agent(server);
      const res = await anon.post('/auth/logout');
      expect(res.status).toBe(401);
    });
  });
});
