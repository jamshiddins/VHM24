#!/usr/bin/env node



const { PrismaClient } = require('@prisma/client');

async function testRailwayConnection() {
    
    
    const prisma = new PrismaClient();
    
    try {
        
        await prisma.$connect();
        
        
        // Тестовый запрос - получаем версию PostgreSQL
        
        const result = await prisma.$queryRaw`SELECT version() as version, current_database() as database, current_user as user`;
        console.log('✅ Версия PostgreSQL:', result[0].version.split(' ')[0] + ' ' + result[0].version.split(' ')[1]);
        
        
        
        // Проверяем существующие таблицы
        
        const tables = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `;
        
        if (tables.length > 0) {
            
            tables.forEach(table => {
                
            });
        } else {
            console.log('⚠️ Таблицы не найдены (база данных пустая)');
        }
        
        // Тестируем создание простой таблицы
        
        try {
            await prisma.$executeRaw`
                CREATE TABLE IF NOT EXISTS test_connection (
                    id SERIAL PRIMARY KEY,
                    message TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;
            
            
            // Вставляем тестовую запись
            await prisma.$executeRaw`
                INSERT INTO test_connection (message) 
                VALUES ('Railway connection test successful!')
            `;
            
            
            // Читаем тестовую запись
            const testData = await prisma.$queryRaw`
                SELECT * FROM test_connection ORDER BY created_at DESC LIMIT 1
            `;
            
            
            // Удаляем тестовую таблицу
            await prisma.$executeRaw`DROP TABLE test_connection`;
            
            
        } catch (error) {
            
        }
        
        await prisma.$disconnect();
        
        
        
        
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Ошибка подключения к Railway PostgreSQL:');
        console.error('   Сообщение:', error.message);
        
        if (error.code) {
            console.error('   Код ошибки:', error.code);
        }
        
        
        
        
        
        
        
        await prisma.$disconnect();
        process.exit(1);
    }
}

// Запуск теста
if (require.main === module) {
    testRailwayConnection();
}

module.exports = testRailwayConnection;
