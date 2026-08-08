import {
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { Gender } from 'src/shared/enums/gender.enum';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  @Matches(
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~])[\S]+$/,
  )
  password: string;

  @IsOptional()
  @IsString()
  about: string;

  @IsOptional()
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
