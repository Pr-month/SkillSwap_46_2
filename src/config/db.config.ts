import { registerAs, ConfigType } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config();

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
      entities: [path.join(__dirname, '..', '**', '*.entity{.ts,.js}')],
      migrations: [path.join(__dirname, '..', 'migrations', '*{.ts,.js}')],
      synchronize: true,
    }) as DataSourceOptions,
);

export type TDbConfig = ConfigType<typeof dbConfig>;

export const AppDataSource = new DataSource(dbConfig());
