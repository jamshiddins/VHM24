#!/usr/bin/env node

/**
 * ТЕСТИРОВАНИЕ ПОДКЛЮЧЕНИЯ К RAILWAY POSTGRESQL
 */

const { PrismaClient } = require('@prisma/client');

async function testRailwayConnection() {
    console.log('🧪 ТЕСТИРОВАНИЕ ПОДКЛЮЧЕНИЯ К RAILWAY POSTGRESQL');
    
    const prisma = new PrismaClient();
    
    try {
        console.log('🔌 Подключение к Railway PostgreSQL...');
        await prisma.$connect();
        console.log('✅ Подключение успешно!');
        
        // Тестовый запрос - получаем версию PostgreSQL
        console.log('📊 Получение информации о базе данных...');
        const result = await prisma.$queryRaw`SELECT version() as version, current_database() as database, current_user as user`;
        console.log('✅ Версия PostgreSQL:', result[0].version.split(' ')[0] + ' ' + result[0].version.split(' ')[1]);
        console.log('✅ База данных:', result[0].database);
        console.log('✅ Пользователь:', result[0].user);
        
        // Проверяем существующие таблицы
        console.log('📋 Проверка существующих таблиц...');
        const tables = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `;
        
        if (tables.length > 0) {
            console.log('✅ Найдены таблицы:');
            tables.forEach(table => {
                console.log(`   - ${table.table_name}`);
            });
        } else {
            console.log('⚠️ Таблицы не найдены (база данных пустая)');
        }
        
        // Тестируем создание простой таблицы
        console.log('🔧 Тестирование создания таблицы...');
        try {
            await prisma.$executeRaw`
                CREATE TABLE IF NOT EXISTS test_connection (
                    id SERIAL PRIMARY KEY,
                    message TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;
            console.log('✅ Тестовая таблица создана');
            
            // Вставляем тестовую запись
            await prisma.$executeRaw`
                INSERT INTO test_connection (message) 
                VALUES ('Railway connection test successful!')
            `;
            console.log('✅ Тестовая запись добавлена');
            
            // Читаем тестовую запись
            const testData = await prisma.$queryRaw`
                SELECT * FROM test_connection ORDER BY created_at DESC LIMIT 1
            `;
            console.log('✅ Тестовая запись прочитана:', testData[0].message);
            
            // Удаляем тестовую таблицу
            await prisma.$executeRaw`DROP TABLE test_connection`;
            console.log('✅ Тестовая таблица удалена');
            
        } catch (error) {
            console.log('⚠️ Ошибка тестирования таблицы:', error.message);
        }
        
        await prisma.$disconnect();
        console.log('✅ Подключение закрыто');
        
        console.log('\n🎉 ТЕСТ ПОДКЛЮЧЕНИЯ ЗАВЕРШЕН УСПЕШНО!');
        console.log('🌐 Railway PostgreSQL полностью готов к работе');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Ошибка подключения к Railway PostgreSQL:');
        console.error('   Сообщение:', error.message);
        
        if (error.code) {
            console.error('   Код ошибки:', error.code);
        }
        
        console.log('\n🔧 ВОЗМОЖНЫЕ РЕШЕНИЯ:');
        console.log('1. Проверьте DATABASE_URL в .env файле');
        console.log('2. Убедитесь что PostgreSQL запущен в Railway');
        console.log('3. Проверьте сетевое подключение');
        console.log('4. Запустите: railway variables');
        
        await prisma.$disconnect();
        process.exit(1);
    }
}

// Запуск теста
if (require.main === module) {
    testRailwayConnection();
}

module.exports = testRailwayConnection;
