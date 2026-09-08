import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSkillDto {
  @ApiProperty({
    description: 'Название навыка (до 250 символов)',
    example: 'Игра на гитаре',
    maxLength: 250,
  })
  @IsString()
  @MaxLength(250)
  title!: string;

  @ApiPropertyOptional({
    description: 'Описание навыка',
    example: 'Научу основам акустической гитары с нуля',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Массив URL изображений навыка',
    type: [String],
    example: ['https://example.com/guitar-1.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({
    description: 'UUID категории, к которой относится навык',
    format: 'uuid',
  })
  @IsUUID()
  categoryId!: string;
}
