import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { Skill } from './entities/skill.entity';
import { SkillsService } from './skills.service';

describe('SkillsService', () => {
  let service: SkillsService;

  let skillsRepository: jest.Mocked<
    Pick<
      Repository<Skill>,
      | 'create'
      | 'save'
      | 'findOne'
      | 'createQueryBuilder'
      | 'preload'
      | 'delete'
    >
  >;

  let categoriesRepository: jest.Mocked<Pick<Repository<Category>, 'findOne'>>;

  let usersService: jest.Mocked<
    Pick<UsersService, 'findByIdWithFavorites' | 'saveFavorites'>
  >;

  let queryBuilder: {
    where: jest.Mock;
    orderBy: jest.Mock;
    skip: jest.Mock;
    take: jest.Mock;
    getManyAndCount: jest.Mock;
  };

  const ownerId = 'owner-1';
  const otherOwnerId = 'owner-2';
  const skillId = 'skill-1';
  const categoryId = 'category-1';

  const category = {
    id: categoryId,
    name: 'Backend',
  } as Category;

  const skill = {
    id: skillId,
    title: 'NestJS',
    description: 'Backend-разработка',
    images: [],
    user: { id: ownerId } as User,
    category,
    createdAt: new Date('2026-08-22T00:00:00.000Z'),
  } as Skill;

  beforeEach(() => {
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };

    skillsRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest
        .fn()
        .mockReturnValue(queryBuilder as unknown as SelectQueryBuilder<Skill>),
      preload: jest.fn(),
      delete: jest.fn(),
    };

    categoriesRepository = {
      findOne: jest.fn(),
    };

    usersService = {
      findByIdWithFavorites: jest.fn(),
      saveFavorites: jest.fn(),
    };

    service = new SkillsService(
      skillsRepository as unknown as Repository<Skill>,
      categoriesRepository as unknown as Repository<Category>,
      usersService as unknown as UsersService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates and saves a skill with owner and category', async () => {
      const dto = {
        title: 'NestJS',
        description: 'Backend-разработка',
        images: ['image.jpg'],
        categoryId,
      };

      categoriesRepository.findOne.mockResolvedValue(category);
      skillsRepository.create.mockReturnValue(skill);
      skillsRepository.save.mockResolvedValue(skill);

      await expect(service.create(ownerId, dto)).resolves.toBe(skill);

      expect(categoriesRepository.findOne).toHaveBeenCalledWith({
        where: { id: categoryId },
      });

      expect(skillsRepository.create).toHaveBeenCalledWith({
        title: dto.title,
        description: dto.description,
        images: dto.images,
        user: { id: ownerId },
        category,
      });

      expect(skillsRepository.save).toHaveBeenCalledWith(skill);
    });

    it('throws when category does not exist', async () => {
      categoriesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create(ownerId, {
          title: 'NestJS',
          categoryId,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(skillsRepository.create).not.toHaveBeenCalled();
      expect(skillsRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns paginated skills and configures search query', async () => {
      const skills = [skill];
      queryBuilder.getManyAndCount.mockResolvedValue([skills, 25]);

      await expect(
        service.findAll({
          page: 2,
          limit: 10,
          search: 'nest',
        }),
      ).resolves.toEqual({
        data: skills,
        page: 2,
        totalPages: 3,
      });

      expect(skillsRepository.createQueryBuilder).toHaveBeenCalledWith('skill');
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'LOWER(skill.title) LIKE LOWER(:search)',
        {
          search: '%nest%',
        },
      );
      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'skill.createdAt',
        'DESC',
      );
      expect(queryBuilder.skip).toHaveBeenCalledWith(10);
      expect(queryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('throws when requested page does not exist', async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([[], 25]);

      await expect(
        service.findAll({
          page: 4,
          limit: 10,
          search: '',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('throws when skill does not exist', async () => {
      skillsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(ownerId, skillId, {
          title: 'Updated',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(skillsRepository.preload).not.toHaveBeenCalled();
      expect(skillsRepository.save).not.toHaveBeenCalled();
    });

    it('throws when user tries to update another users skill', async () => {
      skillsRepository.findOne.mockResolvedValue(skill);

      await expect(
        service.update(otherOwnerId, skillId, {
          title: 'Updated',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(skillsRepository.preload).not.toHaveBeenCalled();
      expect(skillsRepository.save).not.toHaveBeenCalled();
    });

    it('throws when new category does not exist', async () => {
      skillsRepository.findOne.mockResolvedValue(skill);
      categoriesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(ownerId, skillId, {
          categoryId: 'missing-category',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(skillsRepository.preload).not.toHaveBeenCalled();
      expect(skillsRepository.save).not.toHaveBeenCalled();
    });

    it('updates skill without changing category', async () => {
      const updatedSkill = {
        ...skill,
        title: 'Updated NestJS',
      } as Skill;

      skillsRepository.findOne.mockResolvedValue(skill);
      skillsRepository.preload.mockResolvedValue(updatedSkill);
      skillsRepository.save.mockResolvedValue(updatedSkill);

      await expect(
        service.update(ownerId, skillId, {
          title: 'Updated NestJS',
        }),
      ).resolves.toBe(updatedSkill);

      expect(categoriesRepository.findOne).not.toHaveBeenCalled();
      expect(skillsRepository.preload).toHaveBeenCalledWith({
        id: skillId,
        title: 'Updated NestJS',
      });
      expect(skillsRepository.save).toHaveBeenCalledWith(updatedSkill);
    });

    it('updates skill and assigns a new category', async () => {
      const newCategory = {
        id: 'category-2',
        name: 'Frontend',
      } as Category;

      const updatedSkill = {
        ...skill,
        category: newCategory,
      } as Skill;

      skillsRepository.findOne.mockResolvedValue(skill);
      categoriesRepository.findOne.mockResolvedValue(newCategory);
      skillsRepository.preload.mockResolvedValue(updatedSkill);
      skillsRepository.save.mockResolvedValue(updatedSkill);

      await service.update(ownerId, skillId, {
        categoryId: newCategory.id,
      });

      expect(categoriesRepository.findOne).toHaveBeenCalledWith({
        where: { id: newCategory.id },
      });

      expect(skillsRepository.preload).toHaveBeenCalledWith({
        id: skillId,
        category: newCategory,
      });

      expect(skillsRepository.save).toHaveBeenCalledWith(updatedSkill);
    });

    it('throws when preload cannot build updated skill', async () => {
      skillsRepository.findOne.mockResolvedValue(skill);
      skillsRepository.preload.mockResolvedValue(undefined);

      await expect(
        service.update(ownerId, skillId, {
          title: 'Updated',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(skillsRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('throws when skill does not exist', async () => {
      skillsRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(ownerId, skillId)).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(skillsRepository.delete).not.toHaveBeenCalled();
    });

    it('throws when user tries to delete another users skill', async () => {
      skillsRepository.findOne.mockResolvedValue(skill);

      await expect(
        service.remove(otherOwnerId, skillId),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(skillsRepository.delete).not.toHaveBeenCalled();
    });

    it('deletes owners skill', async () => {
      skillsRepository.findOne.mockResolvedValue(skill);

      await expect(service.remove(ownerId, skillId)).resolves.toEqual({
        message: 'Навык успешно удален',
      });

      expect(skillsRepository.delete).toHaveBeenCalledWith(skillId);
    });
  });

  describe('addToFavorites', () => {
    it('throws when skill does not exist', async () => {
      skillsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addToFavorites(skillId, ownerId),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(usersService.findByIdWithFavorites).not.toHaveBeenCalled();
      expect(usersService.saveFavorites).not.toHaveBeenCalled();
    });

    it('throws when user does not exist', async () => {
      skillsRepository.findOne.mockResolvedValue(skill);
      usersService.findByIdWithFavorites.mockResolvedValue(null);

      await expect(
        service.addToFavorites(skillId, ownerId),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(usersService.saveFavorites).not.toHaveBeenCalled();
    });

    it('throws when skill is already in favorites', async () => {
      const user = {
        id: ownerId,
        favoriteSkills: [skill],
      } as User;

      skillsRepository.findOne.mockResolvedValue(skill);
      usersService.findByIdWithFavorites.mockResolvedValue(user);

      await expect(
        service.addToFavorites(skillId, ownerId),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(usersService.saveFavorites).not.toHaveBeenCalled();
    });

    it('adds skill to favorites and saves user', async () => {
      const user = {
        id: ownerId,
        favoriteSkills: [],
      } as unknown as User;

      skillsRepository.findOne.mockResolvedValue(skill);
      usersService.findByIdWithFavorites.mockResolvedValue(user);

      await expect(service.addToFavorites(skillId, ownerId)).resolves.toEqual({
        message: 'Навык добавлен в избранное',
      });

      expect(user.favoriteSkills).toEqual([skill]);
      expect(usersService.saveFavorites).toHaveBeenCalledWith(user);
    });
  });

  describe('removeFromFavorites', () => {
    it('throws when user does not exist', async () => {
      usersService.findByIdWithFavorites.mockResolvedValue(null);

      await expect(
        service.removeFromFavorites(skillId, ownerId),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(usersService.saveFavorites).not.toHaveBeenCalled();
    });

    it('throws when skill is not in favorites', async () => {
      const user = {
        id: ownerId,
        favoriteSkills: [],
      } as unknown as User;

      usersService.findByIdWithFavorites.mockResolvedValue(user);

      await expect(
        service.removeFromFavorites(skillId, ownerId),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(usersService.saveFavorites).not.toHaveBeenCalled();
    });

    it('removes skill from favorites and saves user', async () => {
      const anotherSkill = {
        id: 'skill-2',
        title: 'TypeScript',
        description: '',
        images: [],
        user: { id: ownerId } as User,
        category,
        createdAt: new Date('2026-08-22T00:00:00.000Z'),
      } as Skill;

      const user = {
        id: ownerId,
        favoriteSkills: [skill, anotherSkill],
      } as User;

      usersService.findByIdWithFavorites.mockResolvedValue(user);

      await expect(
        service.removeFromFavorites(skillId, ownerId),
      ).resolves.toEqual({
        message: 'Навык удалён из избранного',
      });

      expect(user.favoriteSkills).toEqual([anotherSkill]);
      expect(usersService.saveFavorites).toHaveBeenCalledWith(user);
    });
  });
});
