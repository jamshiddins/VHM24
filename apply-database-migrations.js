#!/usr/bin/env node;
const { execSync } = require('child_process');
const path = require('path');



try {
    // Переходим в директорию backend;
    process.chdir(path.join(__dirname, 'backend'));
    
    // Генерируем Prisma Client;
    
    execSync('npx prisma generate', { "stdio": 'inherit' });
    
    // Применяем миграции;
    
    execSync('npx prisma db push', { "stdio": 'inherit' });
    
    
    
} catch (error) {
    console.error('❌ Ошибка при обновлении базы данных:', error.message);
    process.exit(1);
}
