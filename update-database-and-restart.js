require('dotenv').config();
const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 Обновление конфигурации базы данных и перезапуск системы...\n');

// Показываем текущие настройки
console.log('📊 Текущие настройки:');
console.log(`   PostgreSQL: ${process.env.DATABASE_URL?.substring(0, 50)}...`);
console.log(`   Redis: ${process.env.REDIS_URL?.substring(0, 50)}...`);

async function updateAndRestart() {
  try {
    // 1. Останавливаем все сервисы
    console.log('\n1️⃣ Останавливаем все сервисы...');
    try {
      execSync('pm2 stop all', { stdio: 'inherit' });
    } catch (e) {
      console.log('   Сервисы уже остановлены или PM2 не запущен');
    }

    // 2. Ждем 2 секунды
    console.log('\n2️⃣ Ожидание завершения процессов...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Генерируем Prisma клиент
    console.log('\n3️⃣ Генерация Prisma клиента...');
    try {
      execSync('cd packages/database && npx prisma generate', { 
        stdio: 'inherit',
        env: { ...process.env, FORCE_COLOR: '0' }
      });
      console.log('   ✅ Prisma клиент сгенерирован');
    } catch (error) {
      console.log('   ⚠️  Ошибка генерации Prisma клиента:', error.message);
      console.log('   Продолжаем без обновления клиента...');
    }

    // 4. Запускаем сервисы заново
    console.log('\n4️⃣ Запуск сервисов с обновленными переменными...');
    execSync('pm2 start ecosystem.config.js', { stdio: 'inherit' });

    // 5. Обновляем переменные окружения
    console.log('\n5️⃣ Обновление переменных окружения...');
    execSync('pm2 restart all --update-env', { stdio: 'inherit' });

    // 6. Ждем инициализации
    console.log('\n6️⃣ Ожидание инициализации сервисов...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 7. Проверяем статус
    console.log('\n7️⃣ Проверка статуса сервисов...');
    execSync('pm2 status', { stdio: 'inherit' });

    console.log('\n✅ Система обновлена и перезапущена!');
    console.log('\n📝 Полезные команды:');
    console.log('   pm2 logs - просмотр логов');
    console.log('   pm2 monit - мониторинг в реальном времени');
    console.log('   node test-all-services.js - тестирование сервисов');
    console.log('   node test-redis-connection.js - тест Redis');

  } catch (error) {
    console.error('\n❌ Ошибка:', error.message);
    process.exit(1);
  }
}

updateAndRestart();
