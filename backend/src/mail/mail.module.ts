import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mail.service';
import { mailConfig, TMailConfig } from '../config/mail.config';

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [mailConfig.KEY],
      useFactory: (config: TMailConfig) => ({
        transport: config.transport,
        defaults: config.defaults,
      }),
    }),
    ConfigModule,
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
