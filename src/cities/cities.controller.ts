import { Controller, Get, Query, Post, UseGuards, Body } from '@nestjs/common';
import { CitiesService } from './cities.service';
import { CityShort } from './cities.types';
import { AccessTokenGuard } from 'src/auth/guards/accessToken.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/shared/enums/role.enum';
import { CreateCityDto } from './dto/create-city.dto';
import { City } from './entities/city.entity';

@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  async findAll(@Query('search') search?: string): Promise<CityShort[]> {
    return this.citiesService.search(search);
  }

  @Post()
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles([Role.ADMIN])
  create(@Body() dto: CreateCityDto): Promise<City> {
    return this.citiesService.create(dto);
  }
}
