import { AppDataSource } from '../src/config/db.config';

/**
 * Jest globalSetup для e2e-тестов.
 * Подключается к тестовой БД и очищает все таблицы перед запуском тестов,
 * чтобы каждый прогон начинался с чистого состояния.
 */
export default async function setup() {
  await AppDataSource.initialize();

  try {
    const tables = AppDataSource.entityMetadatas.map(
      (entity) => `"${entity.tableName}"`,
    );

    if (tables.length === 0) {
      return;
    }

    await AppDataSource.query(
      `TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE`,
    );
    console.log('[setup-e2e] Тестовая БД очищена перед запуском e2e-тестов');
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}
