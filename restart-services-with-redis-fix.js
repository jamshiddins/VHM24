#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');

console.log('🔄 Перезапуск сервисов с исправленным Redis...');

// Функция для выполнения команды
function executeCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        console.error(`Ошибка: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`);
      }
      console.log(stdout);
      resolve(stdout);
    });
  });
}

async function main() {
  try {
    console.log('1. Остановка всех Node.js процессов...');
    
    // Останавливаем все node процессы (осторожно!)
    try {
      await executeCommand('taskkill /F /IM node.exe', { timeout: 10000 });
    } catch (error) {
      console.log('Процессы Node.js уже остановлены или не найдены');
    }

    // Ждем немного
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('2. Запуск сервисов с исправленным Redis...');
    
    // Запускаем сервисы заново
    const startProcess = spawn('node', ['start-all-services.js'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    console.log('✅ Сервисы перезапущены с исправленным Redis!');
    console.log('📊 Мониторинг логов...');

    // Обработка завершения процесса
    startProcess.on('close', (code) => {
      console.log(`Процесс завершен с кодом ${code}`);
    });

    startProcess.on('error', (error) => {
      console.error('Ошибка запуска:', error);
    });

  } catch (error) {
    console.error('Ошибка при перезапуске сервисов:', error);
    process.exit(1);
  }
}

// Обработка сигналов завершения
process.on('SIGINT', () => {
  console.log('\n🛑 Получен сигнал завершения...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Получен сигнал завершения...');
  process.exit(0);
});

main();
