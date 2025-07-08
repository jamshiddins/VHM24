const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  console.log('Database URL:', process.env.DATABASE_URL ? 'Connected' : 'Not found');
  
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@vhm24.ru' },
          { telegramId: '42283329' }
        ]
      }
    });

    if (existingAdmin) {
      console.log('✅ Admin already exists:', existingAdmin.email);
      return;
    }

    // Create admin user
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@vhm24.ru',
        name: 'System Administrator',
        passwordHash,
        roles: ['ADMIN'],
        telegramId: '42283329', // Your Telegram ID
        phoneNumber: '+998901234567', // Optional
        isActive: true
      }
    });
    
    console.log('✅ Admin created successfully!');
    console.log('Email:', admin.email);
    console.log('Password: admin123');
    console.log('Telegram ID:', admin.telegramId);
    console.log('Roles:', admin.roles);

    // Create some test data
    console.log('\n📦 Creating test data...');

    // Create a location
    const location = await prisma.location.create({
      data: {
        name: 'Main Office',
        address: 'Tashkent, Uzbekistan',
        latitude: 41.2995,
        longitude: 69.2401
      }
    });

    // Create a machine
    const machine = await prisma.machine.create({
      data: {
        code: 'VM-001',
        serialNumber: 'SN-2024-001',
        type: 'Coffee Vending Machine',
        name: 'Coffee Machine #1',
        status: 'ONLINE',
        locationId: location.id
      }
    });

    console.log('✅ Test machine created:', machine.name);

    // Create inventory items
    const items = await Promise.all([
      prisma.inventoryItem.create({
        data: {
          name: 'Coffee Beans',
          sku: 'COFFEE-001',
          unit: 'KG',
          category: 'Ingredients',
          quantity: 50,
          minQuantity: 10,
          price: 25000
        }
      }),
      prisma.inventoryItem.create({
        data: {
          name: 'Sugar',
          sku: 'SUGAR-001',
          unit: 'KG',
          category: 'Ingredients',
          quantity: 30,
          minQuantity: 5,
          price: 5000
        }
      }),
      prisma.inventoryItem.create({
        data: {
          name: 'Milk Powder',
          sku: 'MILK-001',
          unit: 'KG',
          category: 'Ingredients',
          quantity: 20,
          minQuantity: 5,
          price: 15000
        }
      })
    ]);

    console.log('✅ Inventory items created:', items.length);

    // Create machine inventory (bunkers)
    for (const item of items) {
      await prisma.machineInventory.create({
        data: {
          machineId: machine.id,
          itemId: item.id,
          quantity: 5,
          minQuantity: 1,
          maxQuantity: 10
        }
      });
    }

    console.log('✅ Machine bunkers configured');

    // Create a sample task
    const task = await prisma.task.create({
      data: {
        title: 'Refill Coffee Machine',
        description: 'Regular maintenance and refill',
        status: 'CREATED',
        priority: 'MEDIUM',
        machineId: machine.id,
        createdById: admin.id
      }
    });

    console.log('✅ Sample task created:', task.title);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📱 Telegram Bot Usage:');
    console.log('1. Send /start to your bot');
    console.log('2. Login with Telegram ID: 42283329');
    console.log('\n🌐 Web Login:');
    console.log('Email: admin@vhm24.ru');
    console.log('Password: admin123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
