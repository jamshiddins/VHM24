#!/usr/bin/env node



const { execSync } = require('child_process');



try {
    // Проверяем Railway CLI
    execSync('railway --version', { stdio: 'pipe' });
    
    
    // Логинимся если нужно
    try {
        execSync('railway whoami', { stdio: 'pipe' });
        
    } catch {
        
        execSync('railway login', { stdio: 'inherit' });
    }
    
    // Линкуем проект если нужно
    try {
        execSync('railway status', { stdio: 'pipe' });
        
    } catch {
        
        execSync('railway link', { stdio: 'inherit' });
    }
    
    // Устанавливаем переменные окружения
    
    execSync('railway variables set NODE_ENV=production', { stdio: 'inherit' });
    
    // Деплоим
    
    execSync('railway up', { stdio: 'inherit' });
    
    
    
    // Показываем URL
    try {
        const url = execSync('railway domain', { encoding: 'utf8' });
        console.log(`🌐 Приложение доступно по адресу: ${url.trim()}`);
    } catch {
        
    }
    
} catch (error) {
    console.error('💥 Ошибка деплоя:', error.message);
    
    process.exit(1);
}
