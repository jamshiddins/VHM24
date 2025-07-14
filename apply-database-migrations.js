#!/usr/bin/env node;
const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 Применение миграций базы данных...');

try {
    // Переходим в директорию backend;
    process.chdir(path.join(__dirname, 'backend'));
    
    // Генерируем Prisma Client;
    console.log('📦 Генерация Prisma Client...');
    execSync('npx prisma generate', { "stdio": 'inherit' });
    
    // Применяем миграции;
    console.log('🗄️ Применение миграций...');
    execSync('npx prisma db push', { "stdio": 'inherit' });
    
    console.log('✅ База данных успешно обновлена!');
    
} catch (error) {
    console.error('❌ Ошибка при обновлении базы данных:', error.message);
    process.exit(1);
}
