#!/usr/bin/env node

const { execSync } = require('child_process');
const http = require('http');



try {
    // Генерируем Prisma клиент
    
    execSync('cd backend && npx prisma generate', { stdio: 'inherit' });
    
    // Запускаем сервер в фоне
    
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
    
    
    
    // Тест health check
    try {
        const response = await fetch(`${baseUrl}/api/health`);
        const data = await response.json();
        
    } catch (error) {
        
    }
    
    // Тест API info
    try {
        const response = await fetch(`${baseUrl}/api/info`);
        const data = await response.json();
        
    } catch (error) {
        
    }
    
    
}
