import { Controller, Get, Query } from '@nestjs/common';
import { CitiesService } from './cities.service';
import { CityShort } from './cities.types';

@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  async findAll(@Query('search') search?: string): Promise<CityShort[]> {
    return this.citiesService.search(search);
  }
}
