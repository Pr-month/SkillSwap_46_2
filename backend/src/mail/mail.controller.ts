import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MailService } from './mail.service';
import { SendEmailDto } from './dto/send-email.dto';

@ApiTags('mail')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Отправить письмо' })
  async sendEmail(@Body() dto: SendEmailDto): Promise<void> {
    await this.mailService.sendEmail(dto);
  }
}
