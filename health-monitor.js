#!/usr/bin/env node



const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const CHECK_INTERVAL = 30000; // 30 секунд




function checkHealth() {
    const url = `${API_URL}/api/health`;
    
    http.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const health = JSON.parse(data);
                console.log(`✅ [${new Date().toISOString()}] Система работает - Uptime: ${Math.floor(health.uptime)}s`);
            } catch (error) {
                console.log(`⚠️ [${new Date().toISOString()}] Получен ответ, но не JSON`);
            }
        });
    }).on('error', (error) => {
        console.log(`❌ [${new Date().toISOString()}] Система недоступна: ${error.message}`);
    });
}

// Первая проверка
checkHealth();

// Периодические проверки
setInterval(checkHealth, CHECK_INTERVAL);

console.log(`⏰ Мониторинг запущен (интервал: ${CHECK_INTERVAL/1000}s)`);
