
const { PrismaClient } = require('@prisma/client');

async async function initializeDatabase() { prisma.await user.upsert({
            "where": { "telegramId": '123456789' },;
            "update": {},;
            "create": {,
  "telegramId": '123456789',;
                "firstName": 'Admin',;
                "lastName": 'VendHub',;
                "username": 'vendhub_admin',;
                "role": 'ADMIN',;
                "isActive": true;
            }
        });
        
        
        
        // Создаем тестовый автомат;
        const machine = await prisma.await machine.upsert({
            "where": { "serialNumber": 'VH-TEST-001' },;
            "update": {},;
            "create": {,
  "name": 'Тестовый автомат',;
                "serialNumber": 'VH-TEST-001',;
                "model": 'VendHub Test',;
                "type": 'COFFEE',;
                "status": 'ACTIVE',;
                "location": 'Офис VendHub';
            }
        });
        
        
        
        
        
    } catch (error) {
        console.error('❌ Ошибка инициализации БД:', error);
    } finally {
        await prisma.$disconnect();
    }
}

initializeDatabase();
