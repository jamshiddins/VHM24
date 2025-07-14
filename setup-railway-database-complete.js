#!/usr/bin/env node

/**
 * ПОЛНАЯ НАСТРОЙКА RAILWAY БАЗЫ ДАННЫХ
 * Создает PostgreSQL базу данных в Railway и настраивает все подключения
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class RailwayDatabaseSetup {
    constructor() {
        this.projectRoot = process.cwd();
        this.railwayKeys = {};
        
        console.log('🚀 НАСТРОЙКА RAILWAY БАЗЫ ДАННЫХ');
    }

    async run() {
        try {
            // 1. Проверяем Railway CLI
            await this.checkRailwayCLI();
            
            // 2. Создаем новый проект или используем существующий
            await this.setupRailwayProject();
            
            // 3. Добавляем PostgreSQL
            await this.addPostgreSQL();
            
            // 4. Получаем DATABASE_URL
            await this.getDatabaseURL();
            
            // 5. Обновляем .env
            await this.updateEnvFile();
            
            // 6. Тестируем подключение
            await this.testConnection();
            
            // 7. Деплоим проект
            await this.deployProject();
            
            console.log('\n🎉 RAILWAY БАЗА ДАННЫХ НАСТРОЕНА!');
            
        } catch (error) {
            console.error('💥 Ошибка:', error.message);
            process.exit(1);
        }
    }

    async checkRailwayCLI() {
        console.log('\n🔍 1. ПРОВЕРКА RAILWAY CLI');
        
        try {
            const version = execSync('railway --version', { encoding: 'utf8' });
            console.log(`✅ Railway CLI найден: ${version.trim()}`);
        } catch (error) {
            console.log('❌ Railway CLI не найден');
            console.log('📥 Установите Railway CLI:');
            console.log('   npm install -g @railway/cli');
            console.log('   или');
            console.log('   curl -fsSL https://railway.app/install.sh | sh');
            throw new Error('Railway CLI не установлен');
        }
    }

    async setupRailwayProject() {
        console.log('\n🏗️ 2. НАСТРОЙКА RAILWAY ПРОЕКТА');
        
        try {
            // Проверяем, есть ли уже проект
            const status = execSync('railway status', { encoding: 'utf8', stdio: 'pipe' });
            console.log('✅ Railway проект уже настроен');
        } catch (error) {
            console.log('🔧 Создание нового Railway проекта...');
            try {
                execSync('railway login', { stdio: 'inherit' });
                execSync('railway init', { stdio: 'inherit' });
                console.log('✅ Railway проект создан');
            } catch (initError) {
                throw new Error('Не удалось создать Railway проект');
            }
        }
    }

    async addPostgreSQL() {
        console.log('\n🗄️ 3. ДОБАВЛЕНИЕ POSTGRESQL');
        
        try {
            // Проверяем, есть ли уже PostgreSQL
            const services = execSync('railway service list', { encoding: 'utf8', stdio: 'pipe' });
            if (services.includes('postgres')) {
                console.log('✅ PostgreSQL уже добавлен');
                return;
            }
        } catch (error) {
            // Продолжаем, если команда не работает
        }

        try {
            console.log('🔧 Добавление PostgreSQL сервиса...');
            
            // Новый способ добавления PostgreSQL в Railway
            execSync('railway service create --name postgres', { stdio: 'inherit' });
            
            // Ждем создания сервиса
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Добавляем PostgreSQL плагин
            execSync('railway plugin add postgresql', { stdio: 'inherit' });
            
            console.log('✅ PostgreSQL добавлен');
            
            // Ждем инициализации базы данных
            console.log('⏳ Ожидание инициализации базы данных...');
            await new Promise(resolve => setTimeout(resolve, 10000));
            
        } catch (error) {
            console.log('⚠️ Ошибка добавления PostgreSQL, пробуем альтернативный способ...');
            
            try {
                // Альтернативный способ
                execSync('railway plugin add postgresql --service postgres', { stdio: 'inherit' });
                console.log('✅ PostgreSQL добавлен (альтернативный способ)');
            } catch (altError) {
                throw new Error('Не удалось добавить PostgreSQL');
            }
        }
    }

    async getDatabaseURL() {
        console.log('\n🔗 4. ПОЛУЧЕНИЕ DATABASE_URL');
        
        let attempts = 0;
        const maxAttempts = 5;
        
        while (attempts < maxAttempts) {
            try {
                const dbUrl = execSync('railway variables get DATABASE_URL', { 
                    encoding: 'utf8',
                    stdio: 'pipe'
                });
                
                if (dbUrl && dbUrl.trim() && !dbUrl.includes('not found')) {
                    this.railwayKeys.DATABASE_URL = dbUrl.trim();
                    console.log('✅ DATABASE_URL получен');
                    return;
                }
            } catch (error) {
                // Продолжаем попытки
            }
            
            attempts++;
            console.log(`⏳ Попытка ${attempts}/${maxAttempts} получить DATABASE_URL...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
        // Если не удалось получить автоматически, пробуем другие способы
        try {
            console.log('🔧 Попытка получить переменные другим способом...');
            const allVars = execSync('railway variables', { encoding: 'utf8' });
            console.log('📋 Все переменные Railway:');
            console.log(allVars);
            
            // Ищем DATABASE_URL в выводе
            const lines = allVars.split('\n');
            for (const line of lines) {
                if (line.includes('DATABASE_URL')) {
                    const match = line.match(/DATABASE_URL[=\s]+(.+)/);
                    if (match && match[1]) {
                        this.railwayKeys.DATABASE_URL = match[1].trim();
                        console.log('✅ DATABASE_URL найден в переменных');
                        return;
                    }
                }
            }
        } catch (error) {
            console.log('⚠️ Не удалось получить переменные');
        }
        
        throw new Error('Не удалось получить DATABASE_URL');
    }

    async updateEnvFile() {
        console.log('\n📝 5. ОБНОВЛЕНИЕ .ENV ФАЙЛА');
        
        if (!this.railwayKeys.DATABASE_URL) {
            throw new Error('DATABASE_URL не найден');
        }
        
        // Читаем текущий .env
        let envContent = '';
        if (fs.existsSync('.env')) {
            envContent = fs.readFileSync('.env', 'utf8');
        }
        
        // Обновляем DATABASE_URL
        if (envContent.includes('DATABASE_URL=')) {
            envContent = envContent.replace(
                /DATABASE_URL="[^"]*"/,
                `DATABASE_URL="${this.railwayKeys.DATABASE_URL}"`
            );
        } else {
            envContent = `DATABASE_URL="${this.railwayKeys.DATABASE_URL}"\n` + envContent;
        }
        
        fs.writeFileSync('.env', envContent);
        console.log('✅ .env файл обновлен с Railway DATABASE_URL');
    }

    async testConnection() {
        console.log('\n🧪 6. ТЕСТИРОВАНИЕ ПОДКЛЮЧЕНИЯ');
        
        // Создаем тестовый скрипт
        const testScript = `
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
    const prisma = new PrismaClient();
    
    try {
        console.log('🔌 Подключение к Railway PostgreSQL...');
        await prisma.$connect();
        console.log('✅ Подключение успешно!');
        
        // Тестовый запрос
        const result = await prisma.$queryRaw\`SELECT version() as version\`;
        console.log('✅ Версия PostgreSQL:', result[0].version);
        
        await prisma.$disconnect();
        console.log('✅ Тест подключения завершен успешно');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Ошибка подключения:', error.message);
        process.exit(1);
    }
}

testConnection();
`;

        fs.writeFileSync('test-railway-connection.js', testScript);
        
        try {
            // Генерируем Prisma клиент с новым DATABASE_URL
            console.log('🔧 Генерация Prisma клиента...');
            execSync('cd backend && npx prisma generate', { stdio: 'inherit' });
            
            // Тестируем подключение
            execSync('node test-railway-connection.js', { stdio: 'inherit' });
            console.log('✅ Подключение к Railway PostgreSQL работает!');
            
        } catch (error) {
            throw new Error('Ошибка тестирования подключения');
        }
    }

    async deployProject() {
        console.log('\n🚀 7. ДЕПЛОЙ ПРОЕКТА');
        
        try {
            // Устанавливаем переменные окружения
            console.log('⚙️ Установка переменных окружения...');
            
            const envVars = [
                'NODE_ENV=production',
                'PORT=3000'
            ];
            
            for (const envVar of envVars) {
                try {
                    execSync(`railway variables set "${envVar}"`, { stdio: 'pipe' });
                    console.log(`✅ Установлена переменная: ${envVar.split('=')[0]}`);
                } catch (error) {
                    console.log(`⚠️ Не удалось установить: ${envVar}`);
                }
            }
            
            // Деплоим
            console.log('🚀 Деплой на Railway...');
            execSync('railway up --detach', { stdio: 'inherit' });
            
            // Получаем URL
            try {
                const url = execSync('railway domain', { encoding: 'utf8' });
                console.log(`🌐 Приложение доступно: ${url.trim()}`);
            } catch (error) {
                console.log('⚠️ URL будет доступен после настройки домена');
            }
            
            console.log('✅ Деплой завершен');
            
        } catch (error) {
            console.log('⚠️ Ошибка деплоя, но база данных настроена');
        }
    }
}

// Запуск
if (require.main === module) {
    const setup = new RailwayDatabaseSetup();
    setup.run();
}

module.exports = RailwayDatabaseSetup;
