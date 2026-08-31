import { AppDataSource } from '../src/config/db.config';

/**
 * Проверяет, что мы действительно работаем с тестовой БД,
 * чтобы случайно не очистить реальную.
 */
function isTestDatabase(): boolean {
  const dbName = process.env.DB_NAME || '';
  return /_test$/i.test(dbName);
}

/**
 * Jest globalSetup для e2e-тестов.
 * Подключается к тестовой БД и очищает все таблицы перед запуском тестов,
 * чтобы каждый прогон начинался с чистого состояния.
 */
export default async function setup() {
  await AppDataSource.initialize();

  try {
    if (!isTestDatabase()) {
      throw new Error(
        `[setup-e2e] ОТМЕНА очистки: БД "${process.env.DB_NAME}" не является тестовой. ` +
          'Убедитесь, что e2e-тесты запускаются с NODE_ENV=test и .env.test.local.',
      );
    }

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
