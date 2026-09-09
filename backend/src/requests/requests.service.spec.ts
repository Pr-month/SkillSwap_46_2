import { Test, TestingModule } from '@nestjs/testing';
import { RequestsService } from './requests.service';
import { MailService } from '../mail/mail.service';
import { getRepositoryToken } from '@nestjs/typeorm';
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
