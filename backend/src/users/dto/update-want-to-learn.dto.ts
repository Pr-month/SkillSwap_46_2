import { IsArray, IsUUID } from 'class-validator';

export class UpdateWantToLearnDto {
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds: string[];
}
