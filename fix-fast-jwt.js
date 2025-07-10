const logger = require('@vhm24/shared/logger');

/**
 * VHM24 - Fix Fast-JWT Compatibility
 * 
 * Этот скрипт исправляет проблему совместимости fast-jwt с Node.js v22+
 * Проблема: fast-jwt имеет ограничение на версию Node.js < 22
 * Решение: Патчим package.json для удаления ограничения
 */

const fs = require('fs')
const { promises: fsPromises } = fs;
const path = require('path');

// Путь к package.json fast-jwt
const fastJwtPath = path.join(__dirname, 'node_modules', 'fast-jwt', 'package.json');

// Проверяем существование файла
if (!fs.existsSync(fastJwtPath)) {
  logger.error('❌ Не найден package.json для fast-jwt');
  process.exit(1);
}

try {
  // Читаем текущий package.json
  const packageJson = JSON.parse(fs.await fsPromises.readFile(fastJwtPath, 'utf8'));
  
  // Сохраняем оригинальные engines для логирования
  const originalEngines = JSON.stringify(packageJson.engines || {});
  
  // Удаляем ограничение на версию Node.js
  if (packageJson.engines && packageJson.engines.node) {
    logger.info(`ℹ️ Текущее ограничение: ${packageJson.engines.node}`);
    packageJson.engines.node = ">=16";
    logger.info(`✅ Новое ограничение: ${packageJson.engines.node}`);
  } else {
    logger.info('ℹ️ Ограничение на версию Node.js не найдено');
  }
  
  // Записываем обновленный package.json
  fs.await fsPromises.writeFile(fastJwtPath, JSON.stringify(packageJson, null, 2), 'utf8');
  
  logger.info(`✅ Успешно обновлен ${fastJwtPath}`);
  logger.info(`ℹ️ Изменено: engines с ${originalEngines} на ${JSON.stringify(packageJson.engines || {})}`);
  
} catch (error) {
  logger.error('❌ Ошибка при обновлении package.json:', error);
  process.exit(1);
}
