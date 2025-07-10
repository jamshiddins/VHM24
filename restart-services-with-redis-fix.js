const logger = require('@vhm24/shared/logger');

#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');

logger.info('🔄 Перезапуск сервисов с исправленным Redis...');

// Функция для выполнения команды
function executeCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        logger.error(`Ошибка: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        logger.error(`Stderr: ${stderr}`);
      }
      logger.info(stdout);
      resolve(stdout);
    });
  });
}

async function main() {
  try {
    logger.info('1. Остановка всех Node.js процессов...');
    
    // Останавливаем все node процессы (осторожно!)
    try {
      await executeCommand('taskkill /F /IM node.exe', { timeout: 10000 });
    } catch (error) {
      logger.info('Процессы Node.js уже остановлены или не найдены');
    }

    // Ждем немного
    await new Promise(resolve => setTimeout(resolve, 2000));

    logger.info('2. Запуск сервисов с исправленным Redis...');
    
    // Запускаем сервисы заново
    const startProcess = spawn('node', ['start-all-services.js'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    logger.info('✅ Сервисы перезапущены с исправленным Redis!');
    logger.info('📊 Мониторинг логов...');

    // Обработка завершения процесса
    startProcess.on('close', (code) => {
      logger.info(`Процесс завершен с кодом ${code}`);
    });

    startProcess.on('error', (error) => {
      logger.error('Ошибка запуска:', error);
    });

  } catch (error) {
    logger.error('Ошибка при перезапуске сервисов:', error);
    process.exit(1);
  }
}

// Обработка сигналов завершения
process.on('SIGINT', () => {
  logger.info('\n🛑 Получен сигнал завершения...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('\n🛑 Получен сигнал завершения...');
  process.exit(0);
});

main();
