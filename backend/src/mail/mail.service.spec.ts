import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailerService } from '@nestjs-modules/mailer';
import { mailConfig } from '../config/mail.config';

type MailerServiceMock = {
  sendMail: jest.Mock;
  transporter: { verify: jest.Mock };
};

describe('MailService', () => {
  let service: MailService;
  let mailerService: MailerServiceMock;

  const mockConfig = {
    transport: {
      auth: { user: 'mailer@example.com', pass: 'secret' },
    },
    defaults: {},
    retry: {
      maxRetries: 3,
      delayMs: 10,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
            transporter: {
              verify: jest.fn(),
            },
          },
        },
        {
          provide: mailConfig.KEY,
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get(MailService);
    mailerService = module.get(MailerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should send email successfully', async () => {
    mailerService.sendMail.mockResolvedValueOnce({} as never);

    await service.sendEmail({
      to: 'test@mail.com',
      subject: 'Test',
      text: 'Hello',
    });

    expect(mailerService.sendMail).toHaveBeenCalledTimes(1);
    expect(mailerService.sendMail).toHaveBeenCalledWith({
      to: 'test@mail.com',
      subject: 'Test',
      text: 'Hello',
      html: undefined,
    });
  });

  it('should support html email', async () => {
    mailerService.sendMail.mockResolvedValueOnce({} as never);

    await service.sendEmail({
      to: 'test@mail.com',
      subject: 'HTML',
      html: '<b>Hello</b>',
    });

    expect(mailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        html: '<b>Hello</b>',
      }),
    );
  });

  it('should retry and succeed on last attempt', async () => {
    mailerService.sendMail
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValueOnce({} as never);

    const sleepSpy = jest
      .spyOn(service as unknown as { sleep: () => Promise<void> }, 'sleep')
      .mockResolvedValue(undefined);

    await service.sendEmail({
      to: 'test@mail.com',
      subject: 'Retry Test',
    });

    expect(mailerService.sendMail).toHaveBeenCalledTimes(3);
    expect(sleepSpy).toHaveBeenCalledTimes(2);
  });

  it('should throw after all retries fail', async () => {
    mailerService.sendMail.mockRejectedValue(new Error('fail'));

    const sleepSpy = jest
      .spyOn(service as unknown as { sleep: () => Promise<void> }, 'sleep')
      .mockResolvedValue(undefined);

    await expect(
      service.sendEmail({
        to: 'test@mail.com',
        subject: 'Fail test',
      }),
    ).rejects.toThrow('fail');

    expect(mailerService.sendMail).toHaveBeenCalledTimes(3);
    expect(sleepSpy).toHaveBeenCalledTimes(2);
  });

  it('should verify SMTP connection on init', async () => {
    const verifyMock = jest.fn().mockResolvedValue(true);
    mailerService.transporter.verify = verifyMock;

    await service.onModuleInit();

    expect(verifyMock).toHaveBeenCalled();
  });

  it('should handle missing transporter gracefully', async () => {
    (mailerService as unknown as { transporter: null }).transporter = null;

    await expect(service.onModuleInit()).resolves.not.toThrow();
  });

  it('should skip SMTP verification when mail is not configured', async () => {
    const configNoMail = {
      transport: {},
      defaults: {},
      retry: { maxRetries: 3, delayMs: 10 },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: { transporter: { verify: jest.fn() } },
        },
        {
          provide: mailConfig.KEY,
          useValue: configNoMail,
        },
      ],
    }).compile();

    const localService = module.get(MailService);

    await expect(localService.onModuleInit()).resolves.not.toThrow();
  });

  it('should send user notification', async () => {
    mailerService.sendMail.mockResolvedValueOnce({} as never);

    await service.sendUserNotification('user@mail.com', {
      subject: 'Hello',
      text: 'Message',
    });

    expect(mailerService.sendMail).toHaveBeenCalledWith({
      to: 'user@mail.com',
      subject: 'Hello',
      text: 'Message',
      html: undefined,
    });
  });
});
