#!/usr/bin/env node



const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class RailwayDatabaseSetup {
    constructor() {
        this.projectRoot = process.cwd();
        this.railwayKeys = {};
        
        
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
            
            
            
        } catch (error) {
            console.error('💥 Ошибка:', error.message);
            process.exit(1);
        }
    }

    async checkRailwayCLI() {
        
        
        try {
            const version = execSync('railway --version', { encoding: 'utf8' });
            }`);
        } catch (error) {
            
            
            
            
            
            throw new Error('Railway CLI не установлен');
        }
    }

    async setupRailwayProject() {
        
        
        try {
            // Проверяем, есть ли уже проект
            const status = execSync('railway status', { encoding: 'utf8', stdio: 'pipe' });
            
        } catch (error) {
            
            try {
                execSync('railway login', { stdio: 'inherit' });
                execSync('railway init', { stdio: 'inherit' });
                
            } catch (initError) {
                throw new Error('Не удалось создать Railway проект');
            }
        }
    }

    async addPostgreSQL() {
        
        
        try {
            // Проверяем, есть ли уже PostgreSQL
            const services = execSync('railway service list', { encoding: 'utf8', stdio: 'pipe' });
            if (services.includes('postgres')) {
                
                return;
            }
        } catch (error) {
            // Продолжаем, если команда не работает
        }

        try {
            
            
            // Новый способ добавления PostgreSQL в Railway
            execSync('railway service create --name postgres', { stdio: 'inherit' });
            
            // Ждем создания сервиса
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Добавляем PostgreSQL плагин
            execSync('railway plugin add postgresql', { stdio: 'inherit' });
            
            
            
            // Ждем инициализации базы данных
            
            await new Promise(resolve => setTimeout(resolve, 10000));
            
        } catch (error) {
            
            
            try {
                // Альтернативный способ
                execSync('railway plugin add postgresql --service postgres', { stdio: 'inherit' });
                ');
            } catch (altError) {
                throw new Error('Не удалось добавить PostgreSQL');
            }
        }
    }

    async getDatabaseURL() {
        
        
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
                    
                    return;
                }
            } catch (error) {
                // Продолжаем попытки
            }
            
            attempts++;
            
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
        // Если не удалось получить автоматически, пробуем другие способы
        try {
            
            const allVars = execSync('railway variables', { encoding: 'utf8' });
            
            
            
            // Ищем DATABASE_URL в выводе
            const lines = allVars.split('\n');
            for (const line of lines) {
                if (line.includes('DATABASE_URL')) {
                    const match = line.match(/DATABASE_URL[=\s]+(.+)/);
                    if (match && match[1]) {
                        this.railwayKeys.DATABASE_URL = match[1].trim();
                        
                        return;
                    }
                }
            }
        } catch (error) {
            
        }
        
        throw new Error('Не удалось получить DATABASE_URL');
    }

    async updateEnvFile() {
        
        
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
        
    }

    async testConnection() {
        
        
        // Создаем тестовый скрипт
        const testScript = `
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
    const prisma = new PrismaClient();
    
    try {
        
        await prisma.$connect();
        
        
        // Тестовый запрос
        const result = await prisma.$queryRaw\`SELECT version() as version\`;
        
        
        await prisma.$disconnect();
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Ошибка подключения:', error.message);
        process.exit(1);
    }
}

testConnection();
`;

        fs.writeFileSync(process.env.API_KEY_339 || 'test-railway-connection.js', testScript);
        
        try {
            // Генерируем Prisma клиент с новым DATABASE_URL
            
            execSync('cd backend && npx prisma generate', { stdio: 'inherit' });
            
            // Тестируем подключение
            execSync('node test-railway-connection.js', { stdio: 'inherit' });
            
            
        } catch (error) {
            throw new Error('Ошибка тестирования подключения');
        }
    }

    async deployProject() {
        
        
        try {
            // Устанавливаем переменные окружения
            
            
            const envVars = [
                'NODE_ENV=production',
                'PORT=3000'
            ];
            
            for (const envVar of envVars) {
                try {
                    execSync(`railway variables set "${envVar}"`, { stdio: 'pipe' });
                    [0]}`);
                } catch (error) {
                    
                }
            }
            
            // Деплоим
            
            execSync('railway up --detach', { stdio: 'inherit' });
            
            // Получаем URL
            try {
                const url = execSync('railway domain', { encoding: 'utf8' });
                }`);
            } catch (error) {
                
            }
            
            
            
        } catch (error) {
            
        }
    }
}

// Запуск
if (require.main === module) {
    const setup = new RailwayDatabaseSetup();
    setup.run();
}

module.exports = RailwayDatabaseSetup;
