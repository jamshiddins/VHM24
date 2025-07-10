const logger = require('@vhm24/shared/logger');

#!/usr/bin/env node

const { getAuthClient } = require('./packages/database');
const bcrypt = require('bcrypt');

async function createTelegramUser() {
  const prisma = getAuthClient();
  
  try {
    logger.info('🔧 Creating Telegram user for VHM24 Bot...');
    
    // Ваш Telegram ID из .env
    const telegramId = process.env.ADMIN_IDS || '42283329';
    const email = 'admin@vhm24.ru';
    const name = 'VHM24 Admin';
    const password = '${process.env.PASSWORD_79}';
    
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
        logger.info('✅ Updated existing user with Telegram ID');
      } else {
        logger.info('✅ User with Telegram ID already exists');
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
      
      logger.info('✅ Created new user with Telegram ID');
      logger.info(`📧 Email: ${email}`);
      logger.info(`🔑 Password: ${password}`);
      logger.info(`📱 Telegram ID: ${telegramId}`);
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
    
    logger.info('\n📊 User details:');
    logger.info(JSON.stringify(user, null, 2));
    
    logger.info('\n🎉 Telegram user ready for VHM24 Bot!');
    
  } catch (error) {
    logger.error('❌ Error creating Telegram user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTelegramUser();
