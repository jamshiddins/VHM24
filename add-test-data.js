// Читаем .env вручную
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addTestData() {
  try {
    console.log('Adding test machines...');
    
    // Проверяем, есть ли уже машины
    const existingMachines = await prisma.machine.count();
    if (existingMachines > 0) {
      console.log(`Already have ${existingMachines} machines. Skipping...`);
      return;
    }
    
    // Добавляем машины
    const machines = await Promise.all([
      prisma.machine.create({
        data: {
          code: 'CVM-00001',
          serialNumber: 'SN-001',
          type: 'COFFEE',
          name: 'Кофейный автомат - ТЦ Авиапарк',
          status: 'ONLINE'
        }
      }),
      prisma.machine.create({
        data: {
          code: 'CVM-00002',
          serialNumber: 'SN-002',
          type: 'SNACK',
          name: 'Снековый автомат - БЦ Белая Площадь',
          status: 'ONLINE'
        }
      }),
      prisma.machine.create({
        data: {
          code: 'CVM-00003',
          serialNumber: 'SN-003',
          type: 'COFFEE',
          name: 'Кофейный автомат - Метро Парк Победы',
          status: 'OFFLINE'
        }
      })
    ]);
    
    console.log(`✅ Added ${machines.length} machines`);
    
    // Добавляем задачи
    const tasks = await Promise.all([
      prisma.task.create({
        data: {
          title: 'Пополнить кофе',
          description: 'Заканчивается кофе арабика',
          machineId: machines[0].id,
          status: 'CREATED'
        }
      }),
      prisma.task.create({
        data: {
          title: 'Техобслуживание',
          description: 'Плановое ТО',
          machineId: machines[1].id,
          status: 'ASSIGNED'
        }
      })
    ]);
    
    console.log(`✅ Added ${tasks.length} tasks`);
    
    // Показываем статистику
    const stats = await prisma.machine.groupBy({
      by: ['status'],
      _count: true
    });
    
    console.log('\n��� Machine statistics:');
    stats.forEach(s => {
      console.log(`   ${s.status}: ${s._count} machines`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.code === 'P2002') {
      console.log('Some machines already exist. Skipping...');
    }
  } finally {
    await prisma.$disconnect();
  }
}

addTestData();
