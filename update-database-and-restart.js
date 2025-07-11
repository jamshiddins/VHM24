const logger = require('./packages/shared/utils/logger');

require('dotenv').config();
const { execSync } = require('child_process');
const path = require('path');

logger.info('🔄 Обновление конфигурации базы данных и перезапуск системы...\n');

// Показываем текущие настройки
logger.info('📊 Текущие настройки:');
logger.info(`   PostgreSQL: ${process.env.DATABASE_URL?.substring(0, 50)}...`);
logger.info(`   Redis: ${process.env.REDIS_URL?.substring(0, 50)}...`);

async function updateAndRestart() {
  try {
    // 1. Останавливаем все сервисы
    logger.info('\n1️⃣ Останавливаем все сервисы...');
    try {
      execSync('pm2 stop all', { stdio: 'inherit' });
    } catch (e) {
      logger.info('   Сервисы уже остановлены или PM2 не запущен');
    }

    // 2. Ждем 2 секунды
    logger.info('\n2️⃣ Ожидание завершения процессов...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Генерируем Prisma клиент
    logger.info('\n3️⃣ Генерация Prisma клиента...');
    try {
      execSync('cd packages/database && npx prisma generate', {
        stdio: 'inherit',
        env: { ...process.env, FORCE_COLOR: '0' }
      });
      logger.info('   ✅ Prisma клиент сгенерирован');
    } catch (error) {
      logger.info('   ⚠️  Ошибка генерации Prisma клиента:', error.message);
      logger.info('   Продолжаем без обновления клиента...');
    }

    // 4. Запускаем сервисы заново
    logger.info('\n4️⃣ Запуск сервисов с обновленными переменными...');
    execSync('pm2 start ecosystem.config.js', { stdio: 'inherit' });

    // 5. Обновляем переменные окружения
    logger.info('\n5️⃣ Обновление переменных окружения...');
    execSync('pm2 restart all --update-env', { stdio: 'inherit' });

    // 6. Ждем инициализации
    logger.info('\n6️⃣ Ожидание инициализации сервисов...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 7. Проверяем статус
    logger.info('\n7️⃣ Проверка статуса сервисов...');
    execSync('pm2 status', { stdio: 'inherit' });

    logger.info('\n✅ Система обновлена и перезапущена!');
    logger.info('\n📝 Полезные команды:');
    logger.info('   pm2 logs - просмотр логов');
    logger.info('   pm2 monit - мониторинг в реальном времени');
    logger.info('   node test-all-services.js - тестирование сервисов');
    logger.info('   node test-redis-connection.js - тест Redis');
  } catch (error) {
    logger.error('\n❌ Ошибка:', error.message);
    process.exit(1);
  }
}

updateAndRestart();
