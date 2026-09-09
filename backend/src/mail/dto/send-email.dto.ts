import { IsEmail, IsString, MinLength, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendEmailDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email получателя' })
  @IsEmail()
  to!: string;

  @ApiProperty({ example: 'Новое уведомление', description: 'Тема письма' })
  @IsString()
  @MinLength(1)
  subject!: string;

  @ApiPropertyOptional({
    example: 'Текстовое содержимое письма',
    description: 'Текстовая часть письма',
  })
  @ValidateIf((o: SendEmailDto) => !o.html)
  @IsString()
  @MinLength(1)
  text?: string;

  @ApiPropertyOptional({
    example: '<b>HTML содержимое</b>',
    description: 'HTML-часть письма',
  })
  @ValidateIf((o: SendEmailDto) => !o.text)
  @IsString()
  @MinLength(1)
  html?: string;
}
