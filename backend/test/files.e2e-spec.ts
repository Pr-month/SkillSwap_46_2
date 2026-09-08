import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request, { Response } from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { Express } from 'express';
import { AllExceptionFilter } from '../src/common/filters/all-exception.filter';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';

type Headers = Record<string, string | string[] | undefined>;

describe('FilesController (e2e)', () => {
  let app: INestApplication;
  let server: Express;
  let userRepository: Repository<User>;

  const testUser = {
    email: 'files-test@example.com',
    password: 'StrongP@ssw0rd',
  };

  const SAMPLE_IMAGE = join(__dirname, 'fixtures', 'sample.png');
  const UPLOADS_DIR = join(__dirname, '..', 'public', 'uploads');

  let accessToken = '';

  const extractAccessToken = (res: { headers: Headers }): string | null => {
    const raw = res.headers['set-cookie'];
    if (!raw) return null;
    const cookies = Array.isArray(raw) ? raw : [raw];
    const accessCookie = cookies
      .map((cookie) => cookie.split(';')[0])
      .find((cookie) => cookie.startsWith('accessToken='));
    return accessCookie ? accessCookie.slice('accessToken='.length) : null;
  };

  const uploadedFiles: string[] = [];

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

    const res = await request(server)
      .post('/auth/register')
      .send(testUser)
      .expect(201);
    const token = extractAccessToken(res as { headers: Headers });
    if (!token) {
      throw new Error('Не удалось получить accessToken после регистрации');
    }
    accessToken = token;
  });

  afterAll(async () => {
    if (userRepository) {
      await userRepository.delete({ email: testUser.email });
    }
    // Удаляем файлы, созданные во время тестов
    for (const filename of uploadedFiles) {
      const filePath = join(UPLOADS_DIR, filename);
      if (existsSync(filePath)) {
        rmSync(filePath, { force: true });
      }
    }
    if (app) {
      await app.close();
    }
  });

  describe('POST /files/upload', () => {
    it('должен вернуть 401 без токена доступа', async () => {
      await request(server).post('/files/upload').expect(401);
    });

    it('должен загрузить валидное изображение и вернуть url', async () => {
      const res: Response = await request(server)
        .post('/files/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', SAMPLE_IMAGE)
        .expect(201);

      const body = res.body as { url: string };
      expect(body).toHaveProperty('url');
      expect(typeof body.url).toBe('string');
      expect(body.url).toMatch(/^\/public\/uploads\//);
      expect(body.url).toMatch(/\.png$/);

      const filename = body.url.split('/').pop();
      if (typeof filename === 'string') {
        uploadedFiles.push(filename);
        const savedPath = join(UPLOADS_DIR, filename);
        expect(existsSync(savedPath)).toBeTruthy();
      }
    });

    it('должен вернуть 415 для файла с неразрешённым MIME-типом', async () => {
      const res: Response = await request(server)
        .post('/files/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from('not an image', 'utf8'), {
          filename: 'file.txt',
          contentType: 'text/plain',
        })
        .expect(415);

      expect(res.status).toBe(415);
    });

    it('должен вернуть 413 для файла больше 2MB', async () => {
      const bigFile = Buffer.alloc(2 * 1024 * 1024 + 1);
      const res: Response = await request(server)
        .post('/files/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', bigFile, {
          filename: 'big.png',
          contentType: 'image/png',
        })
        .expect(413);

      expect(res.status).toBe(413);
    });

    it('должен вернуть 400, если файл не был передан', async () => {
      const res: Response = await request(server)
        .post('/files/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('dummy', 'value')
        .expect(400);

      expect(res.status).toBe(400);
    });
  });
});
