import { ConfigType, registerAs } from '@nestjs/config';

export const mailConfig = registerAs('MAIL_CONFIG', () => {
  const port = parseInt(process.env.MAIL_PORT || '465', 10);

  return {
    transport: {
      host: process.env.MAIL_HOST || 'smtp.example.com',
      port,
      secure: process.env.MAIL_SECURE
        ? process.env.MAIL_SECURE === 'true'
        : port === 465,
      auth: {
        user: process.env.MAIL_USER || '',
        pass: process.env.MAIL_PASSWORD || '',
      },
    },
    defaults: {
      from: process.env.MAIL_FROM || '"No Reply" <noreply@example.com>',
    },
    retry: {
      maxRetries: parseInt(process.env.MAIL_MAX_RETRIES || '3', 10),
      delayMs: parseInt(process.env.MAIL_RETRY_DELAY_MS || '1000', 10),
    },
  };
});

export type TMailConfig = ConfigType<typeof mailConfig>;
