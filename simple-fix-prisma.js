#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

console.log('🔧 Простое исправление Prisma для всех сервисов...\n');

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function main() {
  console.log('📦 Генерация основного Prisma клиента...');
  
  try {
    // Генерируем Prisma клиент в основной директории
    await exec('npx prisma generate --schema=packages/database/prisma/schema.prisma');
    console.log('✅ Основной Prisma клиент сгенерирован\n');
    
    // Путь к сгенерированному клиенту
    const sourcePrismaClient = path.join(__dirname, 'packages/database/node_modules/.prisma/client');
    
    // Проверяем существование
    try {
      await fs.access(sourcePrismaClient);
    } catch (error) {
      console.log('❌ Prisma клиент не найден в packages/database');
      console.log('Пробуем альтернативный путь...');
      
      // Альтернативный путь
      const altSourcePath = path.join(__dirname, 'node_modules/.prisma/client');
      await fs.access(altSourcePath);
      sourcePrismaClient = altSourcePath;
    }
    
    console.log('📂 Найден Prisma клиент, копируем во все сервисы...\n');
    
    // Список всех мест куда нужно скопировать
    const destinations = [
      'packages/shared/node_modules/.prisma/client',
      'services/gateway/node_modules/.prisma/client',
      'services/auth/node_modules/.prisma/client',
      'services/machines/node_modules/.prisma/client',
      'services/inventory/node_modules/.prisma/client',
      'services/tasks/node_modules/.prisma/client',
      'services/routes/node_modules/.prisma/client',
      'services/warehouse/node_modules/.prisma/client',
      'services/recipes/node_modules/.prisma/client',
      'services/notifications/node_modules/.prisma/client',
      'services/audit/node_modules/.prisma/client',
      'services/monitoring/node_modules/.prisma/client',
      'services/backup/node_modules/.prisma/client',
      'services/data-import/node_modules/.prisma/client'
    ];
    
    for (const dest of destinations) {
      const destPath = path.join(__dirname, dest);
      const serviceName = dest.split('/')[1];
      
      try {
        console.log(`📦 Копирование в ${serviceName}...`);
        
        // Удаляем старую версию если есть
        try {
          await fs.rm(destPath, { recursive: true, force: true });
        } catch (e) {
          // Игнорируем если не существует
        }
        
        // Копируем новую версию
        await copyDir(sourcePrismaClient, destPath);
        
        // Также создаем ссылку в @prisma/client
        const prismaClientLink = path.join(path.dirname(destPath), '../@prisma/client');
        try {
          await fs.rm(prismaClientLink, { recursive: true, force: true });
        } catch (e) {
          // Игнорируем
        }
        
        await fs.mkdir(path.dirname(prismaClientLink), { recursive: true });
        
        // Создаем package.json для @prisma/client
        const packageJson = {
          name: "@prisma/client",
          main: "index.js",
          types: "index.d.ts"
        };
        
        await fs.writeFile(
          path.join(prismaClientLink, 'package.json'),
          JSON.stringify(packageJson, null, 2)
        );
        
        // Создаем index.js который экспортирует из .prisma/client
        const indexJs = `module.exports = require('../.prisma/client');`;
        await fs.writeFile(path.join(prismaClientLink, 'index.js'), indexJs);
        
        // Создаем index.d.ts
        const indexDts = `export * from '../.prisma/client';`;
        await fs.writeFile(path.join(prismaClientLink, 'index.d.ts'), indexDts);
        
        console.log(`✅ ${serviceName} - готово`);
        
      } catch (error) {
        console.log(`❌ Ошибка для ${serviceName}:`, error.message);
      }
    }
    
    console.log('\n✅ ВСЕ ИСПРАВЛЕНИЯ ПРИМЕНЕНЫ!');
    console.log('\n📋 Теперь запустите тестирование:');
    console.log('   node test-all-components.js');
    console.log('\n🚀 Или запустите проект:');
    console.log('   node start-with-railway.js');
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  }
}

// Запуск
main();
