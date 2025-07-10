const logger = require('@vhm24/shared/logger');

/**
 * VHM24 - PM2 Startup Script
 * 
 * Этот скрипт запускает систему с использованием PM2 для управления процессами
 * PM2 обеспечивает автоматический перезапуск, мониторинг и логирование
 */

const { execSync } = require('child_process');
const fs = require('fs')
const { promises: fsPromises } = fs;
const path = require('path');

logger.info('🚀 Запуск VHM24 с использованием PM2...\n');

try {
  // Проверяем, установлен ли PM2
  try {
    execSync('pm2 --version', { stdio: 'ignore' });
    logger.info('✅ PM2 уже установлен');
  } catch (error) {
    logger.info('⚠️ PM2 не установлен, устанавливаем...');
    execSync('npm install -g pm2', { stdio: 'inherit' });
    logger.info('✅ PM2 успешно установлен');
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
        name: 'vhm24-notifications',
        script: 'services/notifications/src/index.js',
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
  await fsPromises.writeFile('ecosystem.config.js', `module.exports = ${JSON.stringify(pm2Config, null, 2)}`);
  logger.info('✅ Создан конфигурационный файл PM2: ecosystem.config.js');

  // Запускаем систему с использованием PM2
  logger.info('\n🚀 Запуск системы с использованием PM2...');
  execSync('pm2 start ecosystem.config.js', { stdio: 'inherit' });

  // Сохраняем конфигурацию PM2 для автозапуска при перезагрузке
  logger.info('\n💾 Настройка автозапуска при перезагрузке системы...');
  execSync('pm2 save', { stdio: 'inherit' });
  
  // Выводим информацию о запущенных процессах
  logger.info('\n📊 Статус запущенных процессов:');
  execSync('pm2 list', { stdio: 'inherit' });
  
  logger.info('\n✅ Система успешно запущена с использованием PM2!');
  logger.info('📝 Для просмотра логов используйте: pm2 logs');
  logger.info('🔄 Для перезапуска всех сервисов: pm2 restart all');
  logger.info('⏹️ Для остановки всех сервисов: pm2 stop all');
  logger.info('🔍 Для мониторинга: pm2 monit');
} catch (error) {
  logger.error('\n❌ Ошибка при запуске системы с использованием PM2:', error.message);
  process.exit(1);
}
