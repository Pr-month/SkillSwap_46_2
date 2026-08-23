import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository, ILike } from 'typeorm';
import { City } from './entities/city.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CityShort } from './cities.types';
import { UpdateCityDto } from './dto/update-city.dto';

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

  async update(id: string, dto: UpdateCityDto): Promise<City> {
    const city = await this.cityRepository.findOne({ where: { id } });

    if (!city) {
      throw new NotFoundException(`Город с id "${id}" не найден`);
    }

    if (dto.name !== undefined && dto.name !== city.name) {
      const existing = await this.cityRepository.findOne({
        where: { name: dto.name },
      });

      if (existing) {
        throw new ConflictException(`Город "${dto.name}" уже существует`);
      }

      city.name = dto.name;
    }

    if (dto.region !== undefined) {
      city.region = dto.region;
    }

    return this.cityRepository.save(city);
  }
}
