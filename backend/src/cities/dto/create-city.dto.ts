import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCityDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  region: string;
}