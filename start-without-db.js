#!/usr/bin/env node

/**
 * VHM24 Starter без базы данных
 * Запускает систему без миграций (для тестирования)
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Запуск VHM24 без базы данных...');

// Проверяем .env файл
if (!fs.existsSync('.env')) {
    console.error('❌ Файл .env не найден!');
    console.log('📝 Создайте .env файл на основе .env.example');
    process.exit(1);
}

try {
    // Генерируем Prisma клиент
    console.log('🔧 Генерация Prisma клиента...');
    execSync('npm run generate', { stdio: 'inherit' });
    
    // Пропускаем миграции и запускаем приложение
    console.log('⚠️ Пропускаем миграции (база данных недоступна)');
    console.log('✅ Запуск приложения...');
    execSync('node backend/src/index.js', { stdio: 'inherit' });
    
} catch (error) {
    console.error('💥 Ошибка запуска:', error.message);
    process.exit(1);
}
