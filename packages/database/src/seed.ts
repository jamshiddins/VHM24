import { PrismaClient, UserRole, MachineStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@vhm24.ru' },
    update: {},
    create: {
      email: 'admin@vhm24.ru',
      name: 'Administrator',
      passwordHash: adminPassword,
      roles: [UserRole.ADMIN]
    }
  });

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
