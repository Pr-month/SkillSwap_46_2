import { registerAs, ConfigType } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as path from 'path';
import * as dotenv from 'dotenv';

/**
 * Возвращает путь к файлу переменных окружения в зависимости от окружения.
 * - Для тестов (NODE_ENV=test) используется тестовая БД из .env.test.local
 * - Для остальных окружений — реальная БД из .env
 */
export function getEnvFilePath(): string {
  return process.env.NODE_ENV === 'test' ? '.env.test.local' : '.env';
}

dotenv.config({ path: getEnvFilePath() });

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
      synchronize: process.env.DB_SYNC === 'true',
      ssl:
        process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    }) as DataSourceOptions,
);

export type TDbConfig = ConfigType<typeof dbConfig>;

export const AppDataSource = new DataSource(dbConfig());
