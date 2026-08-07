import { registerAs, ConfigType } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';

export const dbConfig = registerAs(
  'DB_CONFIG',
  () =>
    ({
      type: process.env.DB_DRIVER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      synchronize: false,
    }) as DataSourceOptions,
);

export type TDbConfig = ConfigType<typeof dbConfig>;
