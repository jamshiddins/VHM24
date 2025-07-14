#!/usr/bin/env node

/**
 * VHM24 Production Starter
 * Запускает систему в продакшн режиме
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Запуск VHM24 в продакшн режиме...');

// Проверяем .env файл
if (!fs.existsSync('.env')) {
    console.error('❌ Файл .env не найден!');
    console.log('📝 Создайте .env файл на основе .env.example');
    process.exit(1);
}

// Проверяем DATABASE_URL
const envContent = fs.readFileSync('.env', 'utf8');
if (!envContent.includes('DATABASE_URL=')) {
    console.error('❌ DATABASE_URL не найден в .env файле!');
    process.exit(1);
}

// Проверяем что DATABASE_URL не содержит placeholder значения
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);
if (!dbUrlMatch || dbUrlMatch[1].includes('YOUR_') || dbUrlMatch[1].includes('REQUIRED_')) {
    console.warn('⚠️ DATABASE_URL содержит placeholder значение');
    console.log('📝 Используется локальная база данных для разработки');
}

try {
    // Генерируем Prisma клиент
    console.log('🔧 Генерация Prisma клиента...');
    execSync('npm run generate', { stdio: 'inherit' });
    
    // Применяем миграции
    console.log('🗄️ Применение миграций базы данных...');
    execSync('npm run migrate', { stdio: 'inherit' });
    
    // Запускаем приложение
    console.log('✅ Запуск приложения...');
    execSync('node backend/src/index.js', { stdio: 'inherit' });
    
} catch (error) {
    console.error('💥 Ошибка запуска:', error.message);
    process.exit(1);
}
