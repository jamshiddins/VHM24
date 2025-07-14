
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
    const prisma = new PrismaClient();
    
    try {
        await prisma.$connect();
        
        
        // Тестируем простой запрос
        const result = await prisma.$queryRaw`SELECT 1 as test`;
        
        
        await prisma.$disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Ошибка подключения к базе данных:', error.message);
        process.exit(1);
    }
}

testConnection();
