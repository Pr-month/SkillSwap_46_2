import { Injectable } from '@nestjs/common';
import { Repository, ILike } from 'typeorm';
import { City } from './entities/city.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CityShort } from './cities.types';

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
}
