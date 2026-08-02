import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(32)
  newPassword: string;
}