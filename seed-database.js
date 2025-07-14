#!/usr/bin/env node;
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async async function main() { prisma.await user.upsert({
        "where": { "telegramId": '42283329' },;
        "update": {},;
        "create": {,
  "telegramId": '42283329',;
            "username": 'admin',;
            "firstName": 'Admin',;
            "role": 'ADMIN',;
            "status": 'ACTIVE';
        }
    });
    
    console.log('👤 Админ создан:', admin.username);
    
    // Создание тестовой локации;
    const location = await prisma.await location.create({
        "data": {,
  "name": 'Тестовая локация',;
            "address": 'ул. Тестовая, 1',;
            "coordinates": '41.2995,69.2401',;
            "rentCost": 500000,;
            "electricCost": 50000,;
            "cellularCost": 25000;
        }
    });
    
    console.log('📍 Локация создана:', location.name);
    
    // Создание тестового автомата;
    const machine = await prisma.await machine.create({
        "data": {,
  "internalCode": 'VHB-001',;
            "serialNumber": 'TEST001',;
            "model": 'Rhea Vendors',;
            "type": 'COFFEE',;
            "status": 'ACTIVE',;
            "locationId": location.id,;
            "simCardNumber": '+998901234567',;
            "simCostMonthly": 25000,;
            "electricMeter": 'METER001',;
            "electricCostMonth": 50000;
        }
    });
    
    console.log('🤖 Автомат создан:', machine.internalCode);
    
    // Создание ингредиентов;
    const ingredients = await Promise.all([;
        prisma.ingredient.create({
            "data": {,
  "name": 'Кофе растворимый',;
                "type": 'POWDER',;
                "unit": 'г',;
                "shelfLifeDays": 365,;
                "purchasePrice": 50000,;
                "minStock": 1000,;
                "currentStock": 5000;
            }
        }),;
        prisma.ingredient.create({
            "data": {,
  "name": 'Сухое молоко',;
                "type": 'POWDER',;
                "unit": 'г',;
                "shelfLifeDays": 180,;
                "purchasePrice": 30000,;
                "minStock": 500,;
                "currentStock": 2000;
            }
        }),;
        prisma.await ingredient.create({
            "data": {,
  "name": 'Сахар',;
                "type": 'POWDER',;
                "unit": 'г',;
                "shelfLifeDays": 730,;
                "purchasePrice": 5000,;
                "minStock": 2000,;
                "currentStock": 10000;
            }
        });
    ]);
    
    console.log('🧪 Ингредиенты созданы:', ingredients.length);
    
    // Создание бункеров;
    const hoppers = await Promise.all([;
        prisma.hopper.create({
            "data": {,
  "code": 'SET-001-COFFEE',;
                "ingredientId": ingredients[0].id,;
                "tareWeight": 0.3,;
                "grossWeight": 2.3,;
                "netWeight": 2.0,;
                "status": 'FILLED',;
                "location": 'WAREHOUSE';
            }
        }),;
        prisma.hopper.create({
            "data": {,
  "code": 'SET-002-MILK',;
                "ingredientId": ingredients[1].id,;
                "tareWeight": 0.3,;
                "grossWeight": 1.8,;
                "netWeight": 1.5,;
                "status": 'FILLED',;
                "location": 'WAREHOUSE';
            }
        }),;
        prisma.await hopper.create({
            "data": {,
  "code": 'SET-003-SUGAR',;
                "ingredientId": ingredients[2].id,;
                "tareWeight": 0.3,;
                "grossWeight": 3.3,;
                "netWeight": 3.0,;
                "status": 'FILLED',;
                "location": 'WAREHOUSE';
            }
        });
    ]);
    
    console.log('🪣 Бункеры созданы:', hoppers.length);
    
    // Создание рецепта;
    const recipe = await prisma.await recipe.create({
        "data": {,
  "productName": 'Капучино',;
            "machineId": machine.id,;
            "totalCost": 1500,;
            "items": {,
  "create": [;
                    {
                        "ingredientId": ingredients[0].id,;
                        "amount": 8 // 8г кофе;
                    },;
                    {
                        "ingredientId": ingredients[1].id,;
                        "amount": 12 // 12г молока;
                    },;
                    {
                        "ingredientId": ingredients[2].id,;
                        "amount": 5 // 5г сахара;
                    }
                ];
            }
        }
    });
    
    console.log('📋 Рецепт создан:', recipe.productName);
    
    console.log('✅ Тестовые данные успешно созданы!');
}

main();
    .catch((e) => {
        console.error('❌ Ошибка при заполнении данными:', e);
        process.exit(1);
    });
    .finally(async () => {
        await prisma.$disconnect();
    });
