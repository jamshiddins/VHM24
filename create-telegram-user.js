#!/usr/bin/env node

const { getAuthClient } = require('./packages/database');
const bcrypt = require('bcrypt');

async function createTelegramUser() {
  const prisma = getAuthClient();
  
  try {
    console.log('🔧 Creating Telegram user for VHM24 Bot...');
    
    // Ваш Telegram ID из .env
    const telegramId = process.env.ADMIN_IDS || '42283329';
    const email = 'admin@vhm24.ru';
    const name = 'VHM24 Admin';
    const password = 'admin123';
    
    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { telegramId },
          { email }
        ]
      }
    });
    
    if (existingUser) {
      if (!existingUser.telegramId) {
        // Обновляем существующего пользователя, добавляем Telegram ID
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { telegramId }
        });
        console.log('✅ Updated existing user with Telegram ID');
      } else {
        console.log('✅ User with Telegram ID already exists');
      }
    } else {
      // Создаем нового пользователя
      const passwordHash = await bcrypt.hash(password, 10);
      
      const user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          telegramId,
          roles: ['ADMIN', 'MANAGER', 'OPERATOR'],
          isActive: true
        }
      });
      
      console.log('✅ Created new user with Telegram ID');
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Password: ${password}`);
      console.log(`📱 Telegram ID: ${telegramId}`);
    }
    
    // Проверяем результат
    const user = await prisma.user.findFirst({
      where: { telegramId },
      select: {
        id: true,
        email: true,
        name: true,
        telegramId: true,
        roles: true,
        isActive: true
      }
    });
    
    console.log('\n📊 User details:');
    console.log(JSON.stringify(user, null, 2));
    
    console.log('\n🎉 Telegram user ready for VHM24 Bot!');
    
  } catch (error) {
    console.error('❌ Error creating Telegram user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTelegramUser();
