#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Исправление DATABASE_URL...');

// Функция для выполнения команд Railway
function runRailwayCommand(command) {
    try {
        const result = execSync(command, { 
            encoding: 'utf8', 
            stdio: ['pipe', 'pipe', 'pipe'],
            timeout: 30000 
        });
        return result.trim();
    } catch (error) {
        console.log(`⚠️ Ошибка выполнения команды: ${command}`);
        return null;
    }
}

// Функция для обновления .env файла
function updateEnvFile(databaseUrl) {
    const envPath = path.join(__dirname, '.env');
    
    try {
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        // Обновляем DATABASE_URL
        if (envContent.includes('DATABASE_URL=')) {
            envContent = envContent.replace(
                /DATABASE_URL="[^"]*"/,
                `DATABASE_URL="${databaseUrl}"`
            );
        } else {
            envContent = `DATABASE_URL="${databaseUrl}"\n` + envContent;
        }
        
        fs.writeFileSync(envPath, envContent);
        console.log('✅ .env файл обновлен');
        return true;
    } catch (error) {
        console.error('❌ Ошибка обновления .env файла:', error.message);
        return false;
    }
}

// Основная функция
async function main() {
    console.log('🔍 Попытка получить DATABASE_URL из Railway...');
    
    // Проверяем подключение к Railway
    const loginStatus = runRailwayCommand('railway whoami');
    if (!loginStatus) {
        console.log('❌ Railway CLI не подключен. Выполните: railway login');
        process.exit(1);
    }
    
    console.log(`✅ Railway подключен: ${loginStatus}`);
    
    // Получаем список проектов
    const projects = runRailwayCommand('railway projects');
    console.log('📋 Доступные проекты:', projects);
    
    // Пытаемся получить переменные окружения
    const variables = runRailwayCommand('railway variables');
    if (variables) {
        console.log('🔍 Переменные окружения:');
        console.log(variables);
        
        // Ищем DATABASE_URL в выводе
        const lines = variables.split('\n');
        for (const line of lines) {
            if (line.includes('DATABASE_URL')) {
                const match = line.match(/DATABASE_URL[:\s=]+(.+)/);
                if (match) {
                    const databaseUrl = match[1].trim();
                    console.log('✅ Найден DATABASE_URL:', databaseUrl);
                    
                    if (updateEnvFile(databaseUrl)) {
                        console.log('🎉 DATABASE_URL успешно обновлен!');
                        return;
                    }
                }
            }
        }
    }
    
    // Если не удалось получить через variables, пробуем другие способы
    console.log('🔍 Попытка получить DATABASE_URL через другие методы...');
    
    // Пробуем получить через railway run
    const envVars = runRailwayCommand('railway run env');
    if (envVars && envVars.includes('DATABASE_URL')) {
        const match = envVars.match(/DATABASE_URL=(.+)/);
        if (match) {
            const databaseUrl = match[1].trim();
            console.log('✅ Найден DATABASE_URL через run env:', databaseUrl);
            
            if (updateEnvFile(databaseUrl)) {
                console.log('🎉 DATABASE_URL успешно обновлен!');
                return;
            }
        }
    }
    
    // Если ничего не помогло, создаем базовый URL
    console.log('⚠️ Не удалось автоматически получить DATABASE_URL');
    console.log('📝 Создание базового DATABASE_URL...');
    
    const basicDatabaseUrl = 'postgresql://postgres:password@localhost:5432/vendhub';
    
    if (updateEnvFile(basicDatabaseUrl)) {
        console.log('✅ Установлен базовый DATABASE_URL для локальной разработки');
        console.log('⚠️ Для продакшена нужно будет обновить на правильный URL из Railway');
    }
}

// Запуск
main().catch(error => {
    console.error('❌ Критическая ошибка:', error.message);
    process.exit(1);
});
