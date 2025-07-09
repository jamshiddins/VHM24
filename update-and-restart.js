/**
 * VHM24 - Update and Restart Script
 * 
 * Этот скрипт обновляет систему из репозитория и перезапускает все сервисы
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Обновление и перезапуск системы VHM24...\n');

try {
  // Остановка всех процессов Node.js
  console.log('⏹️ Остановка всех процессов Node.js...');
  try {
    execSync('taskkill /f /im node.exe', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️ Некоторые процессы не удалось остановить, продолжаем...');
  }

  // Получение последних изменений из репозитория
  console.log('\n📥 Получение последних изменений из репозитория...');
  execSync('git pull origin main', { stdio: 'inherit' });

  // Установка зависимостей
  console.log('\n📦 Установка зависимостей...');
  execSync('npm install', { stdio: 'inherit' });

  // Обновление зависимостей Fastify
  console.log('\n🔄 Обновление зависимостей Fastify...');
  execSync('node update-fastify.js', { stdio: 'inherit' });

  // Применение миграций базы данных
  console.log('\n🗃️ Применение миграций базы данных...');
  execSync('cd packages/database && npx prisma migrate deploy', { stdio: 'inherit' });

  // Запуск системы
  console.log('\n🚀 Запуск системы...');
  execSync('npm start', { stdio: 'inherit' });

  console.log('\n✅ Система успешно обновлена и запущена!');
} catch (error) {
  console.error('\n❌ Ошибка при обновлении и запуске системы:', error.message);
  process.exit(1);
}
