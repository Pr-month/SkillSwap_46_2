import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRequestDto {
  @ApiProperty()
  @IsUUID('4')
  @IsNotEmpty()
  receiverId!: string;

  @ApiProperty()
  @IsUUID('4')
  @IsNotEmpty()
  offeredSkillId!: string;

  @ApiProperty()
  @IsUUID('4')
  @IsNotEmpty()
  requestedSkillId!: string;
}
