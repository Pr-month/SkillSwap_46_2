import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import type { SendMailOptions, SentMessageInfo } from 'nodemailer';

import { MailController } from '../src/mail/mail.controller';
import { MailService } from '../src/mail/mail.service';
import { MailerService } from '@nestjs-modules/mailer';
import { mailConfig } from '../src/config/mail.config';

describe('MailController (e2e)', () => {
  let app: INestApplication;
  let sendMailMock: jest.Mock<Promise<SentMessageInfo>, [SendMailOptions]>;

  beforeAll(async () => {
    sendMailMock = jest
      .fn<Promise<SentMessageInfo>, [SendMailOptions]>()
      .mockResolvedValue({} as never);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MailController],
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: (options: SendMailOptions) => sendMailMock(options),
            transporter: {
              verify: jest.fn().mockResolvedValue(true),
            },
          } as Partial<MailerService>,
        },
        {
          provide: mailConfig.KEY,
          useValue: {
            transport: {},
            defaults: {},
            retry: {
              maxRetries: 2,
              delayMs: 1,
            },
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    sendMailMock.mockClear();
  });

  it('should return 204 for valid text email', async () => {
    await request(app.getHttpServer())
      .post('/mail/send')
      .send({
        to: 'test@mail.com',
        subject: 'Hello',
        text: 'Test message',
      })
      .expect(204);

    expect(sendMailMock).toHaveBeenCalledTimes(1);
  });

  it('should return 204 for html email', async () => {
    await request(app.getHttpServer())
      .post('/mail/send')
      .send({
        to: 'test@mail.com',
        subject: 'HTML',
        html: '<b>Hello</b>',
      })
      .expect(204);
  });

  it('should return 400 on invalid email', async () => {
    await request(app.getHttpServer())
      .post('/mail/send')
      .send({
        to: 'invalid-email',
        subject: 'Test',
      })
      .expect(400);
  });

  it('should return 400 when subject missing', async () => {
    await request(app.getHttpServer())
      .post('/mail/send')
      .send({
        to: 'test@mail.com',
      })
      .expect(400);
  });

  it('should return 400 when no text and html', async () => {
    await request(app.getHttpServer())
      .post('/mail/send')
      .send({
        to: 'test@mail.com',
        subject: 'Empty content',
      })
      .expect(400);
  });

  it('should return 500 when sending fails after retries', async () => {
    sendMailMock.mockRejectedValue(new Error('permanent fail'));

    await request(app.getHttpServer())
      .post('/mail/send')
      .send({
        to: 'test@mail.com',
        subject: 'Fail test',
        text: 'fail',
      })
      .expect(500);
  });
});
