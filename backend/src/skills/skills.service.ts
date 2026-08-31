import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Skill } from './entities/skill.entity';
import { FindSkillsDto } from './dto/find-skills.dto';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { UsersService } from '../users/users.service';
import { User } from 'src/users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly usersService: UsersService,
  ) {}

  async create(ownerId: string, createSkillDto: CreateSkillDto) {
    const { categoryId, ...skillData } = createSkillDto;

    const category = await this.categoriesRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Категория с id ${categoryId} не найдена`);
    }

    const skill = this.skillsRepository.create({
      ...skillData,
      user: { id: ownerId } as User,
      category,
    });

    return this.skillsRepository.save(skill);
  }

  async findAll(dto: FindSkillsDto) {
    const { page, limit, search } = dto;

    const query = this.skillsRepository
      .createQueryBuilder('skill')
      .where('LOWER(skill.title) LIKE LOWER(:search)', {
        search: `%${search}%`,
      })
      .orderBy('skill.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    if (totalPages > 0 && page > totalPages) {
      throw new NotFoundException(`Запрашиваемая страница ${page} не найдена.`);
    }

    return {
      data,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} skill`;
  }

  async findSimilarUsers(skillId: string): Promise<User[]> {
    const skill = await this.skillsRepository.findOne({
      where: { id: skillId },
      relations: { category: true },
    });

    if (!skill) {
      throw new NotFoundException(`Skill with id ${skillId} not found`);
    }

    return this.usersRepository
      .createQueryBuilder('user')
      .innerJoin(Skill, 'skill', 'skill.owner_id = user.id')
      .where('skill.category_id = :categoryId', {
        categoryId: skill.category.id,
      })
      .distinct(true)
      .take(10)
      .getMany();
  }
  async update(ownerId: string, id: string, updateSkillDto: UpdateSkillDto) {
    const skill = await this.skillsRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!skill) {
      throw new NotFoundException(`Навый с id ${id} не найден`);
    }

    if (skill.user.id !== ownerId) {
      throw new ForbiddenException('Вы не можете редактировать чужой навык');
    }

    const { categoryId, ...skillData } = updateSkillDto;

    let category: Category | undefined;

    if (categoryId) {
      const foundCategory = await this.categoriesRepository.findOne({
        where: { id: categoryId },
      });

      if (!foundCategory) {
        throw new NotFoundException(`Категория с id ${categoryId} не найдена`);
      }

      category = foundCategory;
    }

    const updatedSkill = await this.skillsRepository.preload({
      id,
      ...skillData,
      ...(category ? { category } : {}),
    });

    if (!updatedSkill) {
      throw new NotFoundException(`Навый с id ${id} не найден`);
    }

    return this.skillsRepository.save(updatedSkill);
  }

  async remove(ownerId: string, id: string): Promise<{ message: string }> {
    const skill = await this.skillsRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!skill) {
      throw new NotFoundException(`Навый с id ${id} не найден`);
    }

    if (skill.user.id !== ownerId) {
      throw new ForbiddenException('Вы не можете удалить чужой навык');
    }

    await this.skillsRepository.delete(id);

    return { message: 'Навык успешно удален' };
  }

  async addToFavorites(
    skillId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const skill = await this.skillsRepository.findOne({
      where: { id: skillId },
    });
    if (!skill) {
      throw new NotFoundException(`Навык с id "${skillId}" не найден`);
    }

    const user = await this.usersService.findByIdWithFavorites(userId);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const alreadyInFavorites = user.favoriteSkills.some(
      (s) => s.id === skillId,
    );
    if (alreadyInFavorites) {
      throw new ConflictException('Навык уже добавлен в избранное');
    }

    user.favoriteSkills.push(skill);
    await this.usersService.saveFavorites(user);

    return { message: 'Навык добавлен в избранное' };
  }

  async removeFromFavorites(
    skillId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findByIdWithFavorites(userId);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const index = user.favoriteSkills.findIndex((s) => s.id === skillId);
    if (index === -1) {
      throw new NotFoundException('Навык не найден в избранном');
    }

    user.favoriteSkills.splice(index, 1);
    await this.usersService.saveFavorites(user);

    return { message: 'Навык удалён из избранного' };
  }
}
