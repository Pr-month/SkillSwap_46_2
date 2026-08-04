import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Skill } from './entities/skill.entity';
import { FindSkillsDto } from './dto/find-skills.dto';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
  ) {}

  create(createSkillDto: CreateSkillDto) {
    void createSkillDto;

    return 'This action adds a new skill';
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

    if ( totalPages > 0 && page > totalPages ) {
      throw new NotFoundException(
        `Запрашиваемая страница ${page} не найдена.`,
      );
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
}
