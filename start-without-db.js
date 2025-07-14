#!/usr/bin/env node



const { execSync } = require('child_process');
const fs = require('fs');



// Проверяем .env файл
if (!fs.existsSync('.env')) {
    console.error('❌ Файл .env не найден!');
    
    process.exit(1);
}

try {
    // Генерируем Prisma клиент
    
    execSync('npm run generate', { stdio: 'inherit' });
    
    // Пропускаем миграции и запускаем приложение
    ');
    
    execSync('node backend/src/index.js', { stdio: 'inherit' });
    
} catch (error) {
    console.error('💥 Ошибка запуска:', error.message);
    process.exit(1);
}
