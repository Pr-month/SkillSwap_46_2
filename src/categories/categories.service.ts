import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  /**
   * Возвращает список основных категорий с их подкатегориями (children).
   */
  async findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({
      where: { parent: IsNull() },
      relations: { children: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: { parent: true, children: true },
    });

    if (!category) {
      throw new NotFoundException(`Категория с id "${id}" не найдена`);
    }

    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    let parent: Category | null = null;

    if (dto.parentId) {
      parent = await this.categoriesRepository.findOne({
        where: { id: dto.parentId },
      });

      if (!parent) {
        throw new BadRequestException(
          `Родительская категория с id "${dto.parentId}" не найдена`,
        );
      }
    }

    const category = this.categoriesRepository.create({
      name: dto.name,
      parent,
    });

    return this.categoriesRepository.save(category);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    if (dto.name !== undefined) {
      category.name = dto.name;
    }

    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new BadRequestException(
          'Категория не может быть родителем самой себя',
        );
      }

      if (dto.parentId && (await this.isDescendant(id, dto.parentId))) {
        throw new BadRequestException(
          'Категория не может быть перенесена в собственную подкатегорию',
        );
      }

      category.parent = dto.parentId
        ? await this.getParent(dto.parentId)
        : null;
    }

    return this.categoriesRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.categoriesRepository.delete(id);
  }

  private async getParent(parentId: string): Promise<Category> {
    const parent = await this.categoriesRepository.findOne({
      where: { id: parentId },
    });

    if (!parent) {
      throw new BadRequestException(
        `Родительская категория с id "${parentId}" не найдена`,
      );
    }

    return parent;
  }

  /**
   * Проверяет, является ли категория descendantId потомком (одной из
   * подкатегорий на любой глубине) категории ancestorId.
   * Защищает дерево категорий от зацикливания: нельзя сделать категорию
   * родителем своего же потомка.
   */
  private async isDescendant(
    ancestorId: string,
    descendantId: string,
  ): Promise<boolean> {
    const visited = new Set<string>();
    let currentId: string | null = descendantId;

    while (currentId) {
      if (visited.has(currentId)) {
        return false;
      }
      visited.add(currentId);

      if (currentId === ancestorId) {
        return true;
      }

      const category = await this.categoriesRepository.findOne({
        where: { id: currentId },
        relations: { parent: true },
      });

      if (!category || !category.parent) {
        return false;
      }

      currentId = category.parent.id;
    }

    return false;
  }
}
