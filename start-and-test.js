#!/usr/bin/env node

const { execSync } = require('child_process');
const http = require('http');

console.log('🚀 Запуск VHM24 с полным тестированием...');

try {
    // Генерируем Prisma клиент
    console.log('🔧 Генерация Prisma клиента...');
    execSync('cd backend && npx prisma generate', { stdio: 'inherit' });
    
    // Запускаем сервер в фоне
    console.log('🌐 Запуск сервера...');
    const server = require('./backend/src/index.js');
    
    // Ждем запуска сервера
    setTimeout(async () => {
        await testEndpoints();
    }, 3000);
    
} catch (error) {
    console.error('💥 Ошибка запуска:', error.message);
    process.exit(1);
}

async function testEndpoints() {
    const baseUrl = process.env.API_URL || 'http://localhost:3000';
    
    console.log('🧪 Тестирование эндпоинтов...');
    
    // Тест health check
    try {
        const response = await fetch(`${baseUrl}/api/health`);
        const data = await response.json();
        console.log('✅ Health check:', data.status);
    } catch (error) {
        console.log('❌ Health check failed:', error.message);
    }
    
    // Тест API info
    try {
        const response = await fetch(`${baseUrl}/api/info`);
        const data = await response.json();
        console.log('✅ API info:', data.name);
    } catch (error) {
        console.log('❌ API info failed:', error.message);
    }
    
    console.log('🎉 Тестирование завершено!');
}
