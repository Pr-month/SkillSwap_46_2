import { Test, TestingModule } from '@nestjs/testing';
import { SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';

describe('SkillsController', () => {
  let controller: SkillsController;
  let skillsService: { findSimilarUsers: jest.Mock };

  beforeEach(async () => {
    skillsService = { findSimilarUsers: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SkillsController],
      providers: [{ provide: SkillsService, useValue: skillsService }],
    }).compile();

    controller = module.get<SkillsController>(SkillsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates finding similar users to the service', () => {
    skillsService.findSimilarUsers.mockReturnValue(['user']);

    expect(controller.findSimilarUsers('skill-1')).toEqual(['user']);
    expect(skillsService.findSimilarUsers).toHaveBeenCalledWith('skill-1');
  });
});
