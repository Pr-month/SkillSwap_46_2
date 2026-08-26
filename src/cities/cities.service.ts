import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository, ILike } from 'typeorm';
import { City } from './entities/city.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CityShort } from './cities.types';
import { UpdateCityDto } from './dto/update-city.dto';
import { CreateCityDto } from './dto/create-city.dto';

const SEARCH_RESULTS_LIMIT = 10;

@Injectable()
export class CitiesService {
  constructor(
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
  ) {}

  async search(search?: string): Promise<CityShort[]> {
    return this.cityRepository.find({
      select: ['id', 'name', 'region'],
      where: search ? { name: ILike(`%${search}%`) } : {},
      order: { name: 'ASC' },
      take: SEARCH_RESULTS_LIMIT,
    });
  }

  async remove(id: string): Promise<void> {
    const city = await this.cityRepository.findOne({
      where: { id },
      relations: { users: true },
    });

    if (!city) {
      throw new NotFoundException(`Город с id "${id}" не найден`);
    }

    if (city.users.length > 0) {
      throw new BadRequestException(
        'Нельзя удалить город, к которому привязаны пользователи',
      );
    }

    await this.cityRepository.delete(id);
  }

  async update(id: string, dto: UpdateCityDto): Promise<City> {
    const city = await this.cityRepository.findOne({ where: { id } });

    if (!city) {
      throw new NotFoundException(`Город с id "${id}" не найден`);
    }
    // Ошибки потому что dto берется из create-city.dto.ts, а это в другой веткке
    // Сначала merge ветки create - после merge этой ветки
    const nextName = dto.name ?? city.name;
    const nextRegion = dto.region ?? city.region;

    const nameOrRegionChanged =
      nextName !== city.name || nextRegion !== city.region;

    if (nameOrRegionChanged) {
      const existing = await this.cityRepository.findOne({
        where: { name: nextName, region: nextRegion },
      });

      if (existing) {
        throw new ConflictException(
          `Город "${nextName}" в регионе "${nextRegion}" уже существует`,
        );
      }
    }

    city.name = nextName;
    city.region = nextRegion;

    return this.cityRepository.save(city);
  }

  async create(dto: CreateCityDto): Promise<City> {
    const existing = await this.cityRepository.findOne({
      where: { name: dto.name, region: dto.region },
    });

    if (existing) {
      throw new ConflictException(
        `Город "${dto.name}" в регионе "${dto.region}" уже существует`,
      );
    }

    const city = this.cityRepository.create({
      name: dto.name,
      region: dto.region,
    });

    return this.cityRepository.save(city);
  }
}
