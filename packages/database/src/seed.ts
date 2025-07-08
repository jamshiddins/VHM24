import { PrismaClient, UserRole, MachineStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding VHM24 (VendHub Manager 24/7) database...');

  // Создаем пользователей
  const adminPassword = await bcrypt.hash('admin123', 10);
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@vhm24.uz' },
      update: {},
      create: {
        email: 'admin@vhm24.uz',
        name: 'VHM24 Administrator',
        passwordHash: adminPassword,
        roles: [UserRole.ADMIN],
        phoneNumber: '+998901234567'
      }
    }),
    prisma.user.upsert({
      where: { email: 'manager@vhm24.uz' },
      update: {},
      create: {
        email: 'manager@vhm24.uz',
        name: 'Operations Manager 24/7',
        passwordHash: adminPassword,
        roles: [UserRole.MANAGER],
        phoneNumber: '+998901234568'
      }
    }),
    prisma.user.upsert({
      where: { email: 'operator@vhm24.uz' },
      update: {},
      create: {
        email: 'operator@vhm24.uz',
        name: 'Field Operator',
        passwordHash: adminPassword,
        roles: [UserRole.OPERATOR],
        phoneNumber: '+998901234569'
      }
    })
  ]);

  // Создаем локации для машин
  const locations = await Promise.all([
    prisma.location.create({
      data: { 
        name: 'Центр города - 24/7',
        address: 'Amir Temur Square, Tashkent',
        latitude: 41.311081,
        longitude: 69.279737,
        isActive: true
      }
    }),
    prisma.location.create({
      data: { 
        name: 'Tashkent City Mall - 24/7',
        address: 'Tashkent City Mall, Yunusabad',
        latitude: 41.368691,
        longitude: 69.287811,
        isActive: true
      }
    })
  ]);

  // Создаем машины
  const machines = await Promise.all([
    prisma.machine.create({
      data: {
        code: 'CVM-00001',
        serialNumber: 'JVM-2024-001',
        name: 'Coffee 24/7 Amir Temur',
        type: 'Jofemar Vision ES Plus',
        status: MachineStatus.ONLINE,
        locationId: locations[0].id,
        lastPing: new Date(),
        metadata: {
          workingHours: '24/7',
          hasNightLight: true,
          paymentMethods: ['cash', 'card', 'qr']
        }
      }
    }),
    prisma.machine.create({
      data: {
        code: 'CVM-00002',
        serialNumber: 'JVM-2024-002',
        name: 'Coffee 24/7 Tashkent City',
        type: 'Jofemar Vision ES Plus',
        status: MachineStatus.ONLINE,
        locationId: locations[1].id,
        lastPing: new Date(),
        metadata: {
          workingHours: '24/7',
          hasNightLight: true,
          paymentMethods: ['cash', 'card', 'qr']
        }
      }
    })
  ]);

  console.log('✅ VHM24 database seeded successfully!');
  console.log('📧 Login: admin@vhm24.uz / admin123');
  console.log('⏰ System ready for 24/7 operation!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
