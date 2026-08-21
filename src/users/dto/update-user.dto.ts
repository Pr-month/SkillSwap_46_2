import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Gender } from 'src/shared/enums/gender.enum';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  about?: string;

  @IsOptional()
  @IsDateString()
  birthdate?: Date;

  @IsOptional()
  @IsUUID()
  cityId?: string | null;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  avatar?: string;
}
