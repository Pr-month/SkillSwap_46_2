import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SendEmailDto } from './dto/send-email.dto';
import { mailConfig } from '../config/mail.config';
import type { TMailConfig } from '../config/mail.config';

export interface NotificationPayload {
  subject: string;
  text: string;
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    @Inject(mailConfig.KEY)
    private readonly config: TMailConfig,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.config.transport?.auth?.user) {
      this.logger.warn('Mail is not configured, skipping SMTP verification');
      return;
    }

    await this.verifyConnection();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async verifyConnection(): Promise<void> {
    try {
      const transporter = (
        this.mailerService as unknown as {
          transporter?: { verify: () => Promise<boolean> };
        }
      ).transporter;

      if (!transporter) {
        throw new Error('Mailer transporter is not initialized');
      }

      await transporter.verify();
      this.logger.log('SMTP connection verified');
    } catch (error) {
      this.logger.error('SMTP connection failed:', error as Error);
    }
  }

  async sendEmail(dto: SendEmailDto): Promise<void> {
    const { maxRetries, delayMs } = this.config.retry;

    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.mailerService.sendMail({
          to: dto.to,
          subject: dto.subject,
          text: dto.text,
          html: dto.html,
        });

        return;
      } catch (error) {
        lastError = error;

        this.logger.error(
          `Mail send failed (attempt ${attempt}/${maxRetries})`,
          error as Error,
        );

        if (attempt < maxRetries) {
          await this.sleep(delayMs);
        }
      }
    }

    // все попытки ретраев провалились
    throw lastError;
  }

  async sendUserNotification(
    email: string,
    payload: NotificationPayload,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: payload.subject,
      text: payload.text,
    });
  }
}
