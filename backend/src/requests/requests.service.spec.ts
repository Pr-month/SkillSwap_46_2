import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RequestsService } from './requests.service';
import { MailService } from '../mail/mail.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { Request } from './entities/request.entity';
import { Skill } from '../skills/entities/skill.entity';

describe('RequestsService', () => {
  let service: RequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        {
          provide: MailService,
          useValue: { sendUserNotification: jest.fn() },
        },
        {
          provide: NotificationsGateway,
          useValue: {
            notifyNewRequest: jest.fn(),
            notifyRequestAccepted: jest.fn(),
            notifyRequestRejected: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Request),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Skill),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
