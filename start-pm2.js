/**
 * VHM24 - PM2 Startup Script
 * 
 * Этот скрипт запускает систему с использованием PM2 для управления процессами
 * PM2 обеспечивает автоматический перезапуск, мониторинг и логирование
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Запуск VHM24 с использованием PM2...\n');

try {
  // Проверяем, установлен ли PM2
  try {
    execSync('pm2 --version', { stdio: 'ignore' });
    console.log('✅ PM2 уже установлен');
  } catch (error) {
    console.log('⚠️ PM2 не установлен, устанавливаем...');
    execSync('npm install -g pm2', { stdio: 'inherit' });
    console.log('✅ PM2 успешно установлен');
  }

  // Создаем конфигурационный файл для PM2
  const pm2Config = {
    apps: [
      {
        name: 'vhm24-auth',
        script: 'services/auth/src/index.js',
        watch: false,
        instances: 1,
        autorestart: true,
        max_memory_restart: '200M',
        env: {
          NODE_ENV: 'production'
        }
      },
      {
        name: 'vhm24-machines',
        script: 'services/machines/src/index.js',
        watch: false,
        instances: 1,
        autorestart: true,
        max_memory_restart: '200M',
        env: {
          NODE_ENV: 'production'
        }
      },
      {
        name: 'vhm24-inventory',
        script: 'services/inventory/src/index.js',
        watch: false,
        instances: 1,
        autorestart: true,
        max_memory_restart: '200M',
        env: {
          NODE_ENV: 'production'
        }
      },
      {
        name: 'vhm24-tasks',
        script: 'services/tasks/src/index.js',
        watch: false,
        instances: 1,
        autorestart: true,
        max_memory_restart: '200M',
        env: {
          NODE_ENV: 'production'
        }
      },
      {
        name: 'vhm24-bunkers',
        script: 'services/bunkers/src/index.js',
        watch: false,
        instances: 1,
        autorestart: true,
        max_memory_restart: '200M',
        env: {
          NODE_ENV: 'production'
        }
      },
      {
        name: 'vhm24-telegram-bot',
        script: 'services/telegram-bot/src/index.js',
        watch: false,
        instances: 1,
        autorestart: true,
        max_memory_restart: '200M',
        env: {
          NODE_ENV: 'production'
        }
      },
      {
        name: 'vhm24-gateway',
        script: 'services/gateway/src/index.js',
        watch: false,
        instances: 1,
        autorestart: true,
        max_memory_restart: '200M',
        env: {
          NODE_ENV: 'production'
        }
      }
    ]
  };

  // Записываем конфигурацию в файл
  fs.writeFileSync('ecosystem.config.js', `module.exports = ${JSON.stringify(pm2Config, null, 2)}`);
  console.log('✅ Создан конфигурационный файл PM2: ecosystem.config.js');

  // Запускаем систему с использованием PM2
  console.log('\n🚀 Запуск системы с использованием PM2...');
  execSync('pm2 start ecosystem.config.js', { stdio: 'inherit' });

  // Сохраняем конфигурацию PM2 для автозапуска при перезагрузке
  console.log('\n💾 Настройка автозапуска при перезагрузке системы...');
  execSync('pm2 save', { stdio: 'inherit' });
  
  // Выводим информацию о запущенных процессах
  console.log('\n📊 Статус запущенных процессов:');
  execSync('pm2 list', { stdio: 'inherit' });
  
  console.log('\n✅ Система успешно запущена с использованием PM2!');
  console.log('📝 Для просмотра логов используйте: pm2 logs');
  console.log('🔄 Для перезапуска всех сервисов: pm2 restart all');
  console.log('⏹️ Для остановки всех сервисов: pm2 stop all');
  console.log('🔍 Для мониторинга: pm2 monit');
} catch (error) {
  console.error('\n❌ Ошибка при запуске системы с использованием PM2:', error.message);
  process.exit(1);
}
