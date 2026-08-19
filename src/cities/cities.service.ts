import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
}
