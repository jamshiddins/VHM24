#!/usr/bin/env node

/**
 * VHM24 Auto Deployer
 * Автоматический деплой на Railway
 */

const { execSync } = require('child_process');

console.log('🚀 Автоматический деплой VHM24 на Railway...');

try {
    // Проверяем Railway CLI
    execSync('railway --version', { stdio: 'pipe' });
    console.log('✅ Railway CLI найден');
    
    // Логинимся если нужно
    try {
        execSync('railway whoami', { stdio: 'pipe' });
        console.log('✅ Уже авторизован в Railway');
    } catch {
        console.log('🔑 Требуется авторизация в Railway...');
        execSync('railway login', { stdio: 'inherit' });
    }
    
    // Линкуем проект если нужно
    try {
        execSync('railway status', { stdio: 'pipe' });
        console.log('✅ Проект уже связан с Railway');
    } catch {
        console.log('🔗 Связывание с Railway проектом...');
        execSync('railway link', { stdio: 'inherit' });
    }
    
    // Устанавливаем переменные окружения
    console.log('⚙️ Настройка переменных окружения...');
    execSync('railway variables set NODE_ENV=production', { stdio: 'inherit' });
    
    // Деплоим
    console.log('🚀 Деплой на Railway...');
    execSync('railway up', { stdio: 'inherit' });
    
    console.log('✅ Деплой завершен успешно!');
    
    // Показываем URL
    try {
        const url = execSync('railway domain', { encoding: 'utf8' });
        console.log(`🌐 Приложение доступно по адресу: ${url.trim()}`);
    } catch {
        console.log('🌐 URL будет доступен после настройки домена');
    }
    
} catch (error) {
    console.error('💥 Ошибка деплоя:', error.message);
    console.log('📖 Убедитесь что Railway CLI установлен: npm install -g @railway/cli');
    process.exit(1);
}
