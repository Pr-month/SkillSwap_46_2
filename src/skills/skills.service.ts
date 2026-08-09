import {
  ConflictException,
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

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
    private readonly usersService: UsersService,
  ) {}

  create(ownerId: string, createSkillDto: CreateSkillDto) {
    const skill = this.skillsRepository.create({
      ...createSkillDto,
      user: { id: ownerId } as User,
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

  update(id: number, updateSkillDto: UpdateSkillDto) {
    void updateSkillDto;

    return `This action updates a #${id} skill`;
  }

  remove(id: number) {
    return `This action removes a #${id} skill`;
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
