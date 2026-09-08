import { IsIn, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RequestStatus } from '../request-status.enums';

export class UpdateRequestDto {
  @ApiProperty()
  @IsIn([RequestStatus.ACCEPTED, RequestStatus.REJECTED])
  @IsNotEmpty()
  status!: RequestStatus;
}
