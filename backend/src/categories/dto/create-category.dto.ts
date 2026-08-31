import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Название категории (1–120 символов)',
    example: 'Программирование',
    minLength: 1,
    maxLength: 120,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({
    description:
      'UUID родительской категории. Если не передан — категория создаётся корневой',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
