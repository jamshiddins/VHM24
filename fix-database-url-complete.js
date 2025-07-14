#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');



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
        
        return true;
    } catch (error) {
        console.error('❌ Ошибка обновления .env файла:', error.message);
        return false;
    }
}

// Основная функция
async function main() {
    
    
    // Проверяем подключение к Railway
    const loginStatus = runRailwayCommand('railway whoami');
    if (!loginStatus) {
        
        process.exit(1);
    }
    
    
    
    // Получаем список проектов
    const projects = runRailwayCommand('railway projects');
    
    
    // Пытаемся получить переменные окружения
    const variables = runRailwayCommand('railway variables');
    if (variables) {
        
        
        
        // Ищем DATABASE_URL в выводе
        const lines = variables.split('\n');
        for (const line of lines) {
            if (line.includes('DATABASE_URL')) {
                const match = line.match(/DATABASE_URL[:\s=]+(.+)/);
                if (match) {
                    const databaseUrl = match[1].trim();
                    
                    
                    if (updateEnvFile(databaseUrl)) {
                        
                        return;
                    }
                }
            }
        }
    }
    
    // Если не удалось получить через variables, пробуем другие способы
    
    
    // Пробуем получить через railway run
    const envVars = runRailwayCommand('railway run env');
    if (envVars && envVars.includes('DATABASE_URL')) {
        const match = envVars.match(/DATABASE_URL=(.+)/);
        if (match) {
            const databaseUrl = match[1].trim();
            
            
            if (updateEnvFile(databaseUrl)) {
                
                return;
            }
        }
    }
    
    // Если ничего не помогло, создаем базовый URL
    
    
    
    const basicDatabaseUrl = 'postgresql://postgres:password@localhost:5432/vendhub';
    
    if (updateEnvFile(basicDatabaseUrl)) {
        
        
    }
}

// Запуск
main().catch(error => {
    console.error('❌ Критическая ошибка:', error.message);
    process.exit(1);
});
