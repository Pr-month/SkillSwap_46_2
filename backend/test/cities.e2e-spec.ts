import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request, { SuperTest, Test as SuperTestCase } from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionFilter } from '../src/common/filters/all-exception.filter';
import { Express } from 'express';
import { CityShort } from '../src/cities/cities.types';

describe('CitiesController (e2e)', () => {
  let app: INestApplication;
  let server: Express;
  type AgentType = SuperTest<SuperTestCase>;
  let agent: AgentType;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new AllExceptionFilter());
    server = app.getHttpServer() as Express;
    agent = request.agent(server) as unknown as AgentType;

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/cities (GET)', () => {
    it('should return 200 and an array of cities', async () => {
      const res = await agent.get('/cities').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter cities by search query', async () => {
      const res = await agent.get('/cities?search=Москва').expect(200);

      const cities = res.body as CityShort[];
      expect(Array.isArray(cities)).toBe(true);
      cities.forEach((city) => {
        expect(city).toHaveProperty('id');
        expect(city).toHaveProperty('name');
        expect(city).toHaveProperty('region');
      });
    });
  });

  describe('Admin endpoints are protected', () => {
    const cityId = '00000000-0000-0000-0000-000000000000';

    it('POST /cities should return 401 without token', async () => {
      await agent
        .post('/cities')
        .send({ name: 'Test City', region: 'Test Region' })
        .expect(401);
    });

    it('PATCH /cities/:id should return 401 without token', async () => {
      await agent
        .patch(`/cities/${cityId}`)
        .send({ name: 'Updated City' })
        .expect(401);
    });

    it('DELETE /cities/:id should return 401 without token', async () => {
      await agent.delete(`/cities/${cityId}`).expect(401);
    });
  });
});
