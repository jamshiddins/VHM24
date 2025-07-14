#!/usr/bin/env node

/**
 * VendHub System Startup Script
 * Запускает все компоненты системы VendHub
 */

// Загружаем переменные окружения из .env файла
require('dotenv').config();

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Запуск системы VendHub...');

// Функция для запуска процесса
function startProcess(name, command, args, cwd) {
  return new Promise((resolve, reject) => {
    console.log(`📦 Запуск ${name}...`);
    
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
        console.log(`✅ ${name} завершен успешно`);
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
    console.log('🔍 Проверка переменных окружения...');
    
    const requiredEnvVars = [
      'DATABASE_URL',
      'TELEGRAM_BOT_TOKEN'
    ];
    
    console.log('📋 Доступные переменные окружения:');
    requiredEnvVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
      } else {
        console.log(`❌ ${varName}: не найдена`);
      }
    });
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Отсутствуют переменные окружения:', missingVars.join(', '));
      console.log('💡 Создайте файл .env с необходимыми переменными');
      process.exit(1);
    }
    
    console.log('✅ Все переменные окружения настроены');
    
    // 2. Миграция базы данных
    console.log('🗄️ Применение миграций базы данных...');
    await startProcess(
      'Prisma Migrate',
      'npx',
      ['prisma', 'db', 'push'],
      path.join(__dirname, 'backend')
    );
    
    // 3. Генерация Prisma Client
    console.log('🔧 Генерация Prisma Client...');
    await startProcess(
      'Prisma Generate',
      'npx',
      ['prisma', 'generate'],
      path.join(__dirname, 'backend')
    );
    
    // 4. Запуск backend сервера
    console.log('🖥️ Запуск backend сервера...');
    const backendProcess = spawn('npm', ['start'], {
      cwd: path.join(__dirname, 'backend'),
      stdio: 'inherit',
      shell: true,
      env: { ...process.env } // Передаем переменные окружения
    });
    
    // Ждем немного для запуска backend
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 5. Запуск Telegram бота
    console.log('🤖 Запуск Telegram бота...');
    const botProcess = spawn('npm', ['start'], {
      cwd: path.join(__dirname, 'apps/telegram-bot'),
      stdio: 'inherit',
      shell: true,
      env: { ...process.env } // Передаем переменные окружения
    });
    
    console.log('🎉 Система VendHub запущена успешно!');
    console.log('📡 Backend API: http://localhost:8000');
    console.log('🤖 Telegram бот активен');
    
    // Обработка завершения
    process.on('SIGINT', () => {
      console.log('\n🛑 Завершение работы системы...');
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
