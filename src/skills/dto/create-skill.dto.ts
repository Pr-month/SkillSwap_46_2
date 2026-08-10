import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSkillDto {
  @IsString()
  @MaxLength(250)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
