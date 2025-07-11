const logger = require('./packages/shared/utils/logger');

/**
 * VHM24 - Update and Restart Script
 *
 * Этот скрипт обновляет систему из репозитория и перезапускает все сервисы
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

logger.info('🔄 Обновление и перезапуск системы VHM24...\n');

try {
  // Остановка всех процессов Node.js
  logger.info('⏹️ Остановка всех процессов Node.js...');
  try {
    execSync('taskkill /f /im node.exe', { stdio: 'inherit' });
  } catch (error) {
    logger.info('⚠️ Некоторые процессы не удалось остановить, продолжаем...');
  }

  // Получение последних изменений из репозитория
  logger.info('\n📥 Получение последних изменений из репозитория...');
  execSync('git pull origin main', { stdio: 'inherit' });

  // Установка зависимостей
  logger.info('\n📦 Установка зависимостей...');
  execSync('npm install', { stdio: 'inherit' });

  // Обновление зависимостей Fastify
  logger.info('\n🔄 Обновление зависимостей Fastify...');
  execSync('node update-fastify.js', { stdio: 'inherit' });

  // Применение миграций базы данных
  logger.info('\n🗃️ Применение миграций базы данных...');
  execSync('cd packages/database && npx prisma migrate deploy', {
    stdio: 'inherit'
  });

  // Запуск системы
  logger.info('\n🚀 Запуск системы...');
  execSync('npm start', { stdio: 'inherit' });

  logger.info('\n✅ Система успешно обновлена и запущена!');
} catch (error) {
  logger.error('\n❌ Ошибка при обновлении и запуске системы:', error.message);
  process.exit(1);
}
