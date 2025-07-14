#!/usr/bin/env node



// Загружаем переменные окружения из .env файла
require('dotenv').config();

const { spawn } = require('child_process');
const path = require('path');



// Функция для запуска процесса
function startProcess(name, command, args, cwd) {
  return new Promise((resolve, reject) => {
    
    
    const childProcess = spawn(command, args, {
      cwd: cwd || __dirname,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env } // Передаем переменные окружения
    });
    
    childProcess.on('error', (error) => {
      console.error(`❌ Ошибка запуска ${name}:`, error);
      reject(error);
    });
    
    childProcess.on('exit', (code) => {
      if (code === 0) {
        
        resolve();
      } else {
        console.error(`❌ ${name} завершен с кодом ${code}`);
        reject(new Error(`Process exited with code ${code}`));
      }
    });
  });
}

// Основная функция запуска
async function startVendHub() {
  try {
    // 1. Проверка переменных окружения
    
    
    const requiredEnvVars = [
      'DATABASE_URL',
      'TELEGRAM_BOT_TOKEN'
    ];
    
    
    requiredEnvVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        }...`);
      } else {
        
      }
    });
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Отсутствуют переменные окружения:', missingVars.join(', '));
      
      process.exit(1);
    }
    
    
    
    // 2. Миграция базы данных
    
    await startProcess(
      'Prisma Migrate',
      'npx',
      ['prisma', 'db', 'push'],
      path.join(__dirname, 'backend')
    );
    
    // 3. Генерация Prisma Client
    
    await startProcess(
      'Prisma Generate',
      'npx',
      ['prisma', 'generate'],
      path.join(__dirname, 'backend')
    );
    
    // 4. Запуск backend сервера
    
    const backendProcess = spawn('npm', ['start'], {
      cwd: path.join(__dirname, 'backend'),
      stdio: 'inherit',
      shell: true,
      env: { ...process.env } // Передаем переменные окружения
    });
    
    // Ждем немного для запуска backend
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 5. Запуск Telegram бота
    
    const botProcess = spawn('npm', ['start'], {
      cwd: path.join(__dirname, 'apps/telegram-bot'),
      stdio: 'inherit',
      shell: true,
      env: { ...process.env } // Передаем переменные окружения
    });
    
    
    
    
    
    // Обработка завершения
    process.on('SIGINT', () => {
      
      backendProcess.kill('SIGINT');
      botProcess.kill('SIGINT');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Ошибка запуска системы:', error);
    process.exit(1);
  }
}

// Запуск
startVendHub();
