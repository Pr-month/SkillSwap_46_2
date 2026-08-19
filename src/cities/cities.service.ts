import { Injectable } from '@nestjs/common';
import { Repository, ILike } from 'typeorm';
import { City } from './entities/city.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CityShort } from './cities.types';
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

  async create(dto: CreateCityDto): Promise<City> {
    const city = this.cityRepository.create({
      name: dto.name,
      region: dto.region,
    });

    return this.cityRepository.save(city);
  }
}
