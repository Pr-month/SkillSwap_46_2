import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Email пользователя',
    example: 'ivan@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Пароль пользователя',
    example: 'Password123!',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    description: 'UUID города из справочника cities',
    example: '000f75f7-caad-50e4-943a-a599c3fb4395',
    format: 'uuid',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  cityId?: string;

  @ApiPropertyOptional({
    description: 'Информация о пользователе',
    example: 'Хочу изучать английский и делиться знаниями по рисованию',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  about?: string;

  @ApiPropertyOptional({
    description: 'Дата рождения',
    example: '1998-04-12',
    format: 'date',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  birthdate?: string;
}
