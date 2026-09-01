import { AppDataSource } from '../config/db.config';

/**
 * Проверяет, что мы действительно работаем с тестовой БД,
 * чтобы случайно не очистить реальную (общий Supabase).
 */
function isTestDatabase(): boolean {
  const dbName = process.env.DB_NAME || '';
  return /_test$/i.test(dbName);
}

/**
 * Очистка тестовой БД перед запуском e2e-тестов.
 * Используется общим скриптом `npm run test:e2e:all`.
 * Аналог глобальной очистки в setup-e2e.ts, но как отдельный шаг,
 * чтобы подготовка (очистка + сидинг) шла ДО запуска jest.
 */
async function cleanE2e(): Promise<void> {
  await AppDataSource.initialize();

  try {
    if (!isTestDatabase()) {
      throw new Error(
        `[clean-e2e] ОТМЕНА очистки: БД "${process.env.DB_NAME}" не является тестовой. ` +
          'Убедитесь, что запуск происходит с NODE_ENV=test и .env.test.local.',
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
    console.log('[clean-e2e] Тестовая БД очищена');
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

cleanE2e()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('[clean-e2e] Ошибка при очистке:', error);
    process.exit(1);
  });