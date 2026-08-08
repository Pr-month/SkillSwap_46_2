import { Type } from 'class-transformer';
import { IsDate, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { Gender } from 'src/shared/enums/gender.enum';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email: string;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  about: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  birthdate: Date;

  @IsOptional()
  @IsString()
  city: string;

  @IsOptional()
  @IsEnum(Gender)
  gender: Gender;

  @IsOptional()
  @IsString()
  avatar: string;
}
