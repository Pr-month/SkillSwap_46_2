import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from 'src/shared/enums/gender.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Email пользователя',
    example: 'ivan@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Имя пользователя',
    example: 'Иван Смирнов',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Информация о пользователе («о себе»)',
    example: 'Backend-разработчик, учусь играть на гитаре',
  })
  @IsOptional()
  @IsString()
  about?: string;

  @ApiPropertyOptional({
    description: 'Дата рождения',
    example: '1995-11-23',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  birthdate?: string;

  @ApiPropertyOptional({
    description:
      'UUID города из справочника cities: существующий id — установить город, null — сбросить, поле не передано — не менять',
    example: '000f75f7-caad-50e4-943a-a599c3fb4395',
    format: 'uuid',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  cityId?: string | null;

  @ApiPropertyOptional({
    description: 'Пол пользователя',
    enum: Gender,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    description: 'URL аватара',
    example: 'https://i.pravatar.cc/300?img=10',
  })
  @IsOptional()
  @IsString()
  avatar?: string;
}
