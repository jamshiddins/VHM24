const logger = require('./packages/shared/utils/logger');

/**
 * VHM24 - Update Fastify Dependencies
 *
 * Этот скрипт обновляет fastify и его плагины во всех сервисах
 * для обеспечения совместимости версий
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Список сервисов
const services = [
  'auth',
  'machines',
  'inventory',
  'tasks',
  'bunkers',
  'gateway'
];

// Зависимости для обновления
const dependencies = [
  'fastify@5.x',
  '@fastify/jwt@latest',
  '@fastify/cors@latest',
  '@fastify/helmet@latest',
  '@fastify/rate-limit@latest',
  '@fastify/swagger@latest'
];

logger.info('🔄 Обновление зависимостей Fastify для всех сервисов...\n');

// Обновляем зависимости для каждого сервиса
services.forEach(service => {
  const servicePath = path.join(__dirname, 'services', service);

  // Проверяем существование директории сервиса
  if (!fs.existsSync(servicePath)) {
    logger.info(`⚠️ Сервис ${service} не найден, пропускаем...`);
    return;
  }

  // Проверяем наличие package.json
  const packageJsonPath = path.join(servicePath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    logger.info(
      `⚠️ package.json для сервиса ${service} не найден, пропускаем...`
    );
    return;
  }

  logger.info(`\n📦 Обновление зависимостей для сервиса ${service}...`);

  try {
    // Устанавливаем зависимости
    const command = `cd ${servicePath} && npm install ${dependencies.join(' ')} --save`;
    execSync(command, { stdio: 'inherit' });
    logger.info(`✅ Зависимости для сервиса ${service} успешно обновлены`);
  } catch (error) {
    logger.error(
      `❌ Ошибка при обновлении зависимостей для сервиса ${service}:`,
      error.message
    );
  }
});

logger.info('\n✅ Обновление зависимостей завершено!');
