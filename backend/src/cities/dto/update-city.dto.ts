import { PartialType } from '@nestjs/mapped-types';
import { CreateCityDto } from './create-city.dto';
// CreateCityDto уже создан, но находится в другой ветке на ревью
export class UpdateCityDto extends PartialType(CreateCityDto) {}
