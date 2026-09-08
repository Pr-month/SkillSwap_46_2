import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { Request } from './entities/request.entity';
import { Skill } from '../skills/entities/skill.entity';

describe('RequestsController', () => {
  let controller: RequestsController;

  const mockRequestRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockSkillRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [
        RequestsService,
        {
          provide: getRepositoryToken(Request),
          useValue: mockRequestRepository,
        },
        {
          provide: getRepositoryToken(Skill),
          useValue: mockSkillRepository,
        },
      ],
    }).compile();

    controller = module.get<RequestsController>(RequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
