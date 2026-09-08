import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FindUsersDto {
  @ApiPropertyOptional({
    description: 'Номер страницы (нумерация с 1)',
    default: 1,
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Размер страницы, максимум 50',
    default: 20,
    minimum: 1,
    maximum: 50,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(50)
  limit: number = 20;
}
