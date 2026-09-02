import { BadRequestException, NotFoundException } from '@nestjs/common';
import { IsNull, Repository } from 'typeorm';
import { CategoriesService } from './categories.service';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoriesRepository: jest.Mocked<
    Pick<
      Repository<Category>,
      'find' | 'findOne' | 'create' | 'save' | 'delete'
    >
  >;

  const makeCategory = (overrides: Partial<Category> = {}): Category => ({
    id: 'category-id',
    name: 'Категория',
    parent: null,
    children: [],
    wantToLearnUsers: [],
    skills: [],
    ...overrides,
  });

  const rootCategory = makeCategory({
    id: 'root-id',
    name: 'Разработка',
  });

  beforeEach(() => {
    categoriesRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    service = new CategoriesService(
      categoriesRepository as unknown as Repository<Category>,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('возвращает корневые категории с подкатегориями в алфавитном порядке', async () => {
      categoriesRepository.find.mockResolvedValue([rootCategory]);

      await expect(service.findAll()).resolves.toEqual([rootCategory]);

      expect(categoriesRepository.find).toHaveBeenCalledWith({
        where: { parent: IsNull() },
        relations: { children: true },
        order: { name: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('возвращает категорию по id вместе с родителем и подкатегориями', async () => {
      categoriesRepository.findOne.mockResolvedValue(rootCategory);

      await expect(service.findOne(rootCategory.id)).resolves.toBe(
        rootCategory,
      );

      expect(categoriesRepository.findOne).toHaveBeenCalledWith({
        where: { id: rootCategory.id },
        relations: { parent: true, children: true },
      });
    });

    it('бросает NotFoundException, если категория не найдена', async () => {
      categoriesRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('создаёт корневую категорию без родителя', async () => {
      const created = makeCategory({
        id: 'new-id',
        name: 'Дизайн',
      });

      categoriesRepository.create.mockReturnValue(created);
      categoriesRepository.save.mockResolvedValue(created);

      await expect(service.create({ name: 'Дизайн' })).resolves.toBe(created);

      expect(categoriesRepository.create).toHaveBeenCalledWith({
        name: 'Дизайн',
        parent: null,
      });
      expect(categoriesRepository.save).toHaveBeenCalledWith(created);
    });

    it('создаёт подкатегорию с существующим родителем', async () => {
      const child = makeCategory({
        id: 'child-id',
        name: 'Backend',
        parent: rootCategory,
      });

      categoriesRepository.findOne.mockResolvedValue(rootCategory);
      categoriesRepository.create.mockReturnValue(child);
      categoriesRepository.save.mockResolvedValue(child);

      await expect(
        service.create({
          name: 'Backend',
          parentId: rootCategory.id,
        }),
      ).resolves.toBe(child);

      expect(categoriesRepository.findOne).toHaveBeenCalledWith({
        where: { id: rootCategory.id },
      });
      expect(categoriesRepository.create).toHaveBeenCalledWith({
        name: 'Backend',
        parent: rootCategory,
      });
    });

    it('бросает BadRequestException, если родитель не найден', async () => {
      categoriesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          name: 'Backend',
          parentId: 'missing-parent',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(categoriesRepository.create).not.toHaveBeenCalled();
      expect(categoriesRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('обновляет название категории', async () => {
      const category = makeCategory({
        id: rootCategory.id,
        name: rootCategory.name,
      });

      categoriesRepository.findOne.mockResolvedValue(category);
      categoriesRepository.save.mockResolvedValue(category);

      await expect(
        service.update(category.id, { name: 'Программирование' }),
      ).resolves.toBe(category);

      expect(category.name).toBe('Программирование');
      expect(categoriesRepository.save).toHaveBeenCalledWith(category);
    });

    it('снимает родительскую категорию', async () => {
      const category = makeCategory({
        id: 'child-id',
        parent: rootCategory,
      });

      const dto = {
        parentId: null,
      } as unknown as UpdateCategoryDto;

      categoriesRepository.findOne.mockResolvedValue(category);
      categoriesRepository.save.mockResolvedValue(category);

      await service.update(category.id, dto);

      expect(category.parent).toBeNull();
      expect(categoriesRepository.save).toHaveBeenCalledWith(category);
    });

    it('не позволяет назначить категорию родителем самой себе', async () => {
      categoriesRepository.findOne.mockResolvedValue(rootCategory);

      await expect(
        service.update(rootCategory.id, {
          parentId: rootCategory.id,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(categoriesRepository.save).not.toHaveBeenCalled();
    });

    it('не позволяет перенести категорию в собственную подкатегорию', async () => {
      const child = makeCategory({
        id: 'child-id',
        name: 'Backend',
        parent: rootCategory,
      });

      categoriesRepository.findOne
        .mockResolvedValueOnce(rootCategory)
        .mockResolvedValueOnce(child);

      await expect(
        service.update(rootCategory.id, {
          parentId: child.id,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(categoriesRepository.save).not.toHaveBeenCalled();
    });

    it('меняет родителя на существующую категорию', async () => {
      const category = makeCategory({
        id: 'child-id',
      });

      const newParent = makeCategory({
        id: 'new-parent-id',
        name: 'Новая группа',
      });

      categoriesRepository.findOne
        .mockResolvedValueOnce(category)
        .mockResolvedValueOnce(newParent)
        .mockResolvedValueOnce(newParent);

      categoriesRepository.save.mockResolvedValue(category);

      await expect(
        service.update(category.id, {
          parentId: newParent.id,
        }),
      ).resolves.toBe(category);

      expect(category.parent).toBe(newParent);
      expect(categoriesRepository.save).toHaveBeenCalledWith(category);
    });

    it('бросает BadRequestException, если новый родитель не найден', async () => {
      const category = makeCategory({
        id: 'child-id',
      });

      categoriesRepository.findOne
        .mockResolvedValueOnce(category)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await expect(
        service.update(category.id, {
          parentId: 'missing-parent',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(categoriesRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('удаляет существующую категорию', async () => {
      categoriesRepository.findOne.mockResolvedValue(rootCategory);
      categoriesRepository.delete.mockResolvedValue({
        raw: [],
        affected: 1,
      });

      await expect(service.remove(rootCategory.id)).resolves.toBeUndefined();

      expect(categoriesRepository.delete).toHaveBeenCalledWith(rootCategory.id);
    });

    it('не удаляет несуществующую категорию', async () => {
      categoriesRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('missing-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(categoriesRepository.delete).not.toHaveBeenCalled();
    });
  });
});
