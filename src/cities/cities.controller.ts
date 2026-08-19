import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CitiesService } from './cities.service';
import { CityShort } from './cities.types';
import { AccessTokenGuard } from 'src/auth/guards/accessToken.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/shared/enums/role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  async findAll(@Query('search') search?: string): Promise<CityShort[]> {
    return this.citiesService.search(search);
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles([Role.ADMIN])
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.citiesService.remove(id);
  }
}
