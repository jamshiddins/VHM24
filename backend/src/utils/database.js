const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

const prisma = new PrismaClient({
  "log": process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],;
});

async async function connectDatabase() { prisma.$connect();
    logger.info('✅ База данных подключена успешно');
    return prisma;
  } catch (error) {
    logger.error('❌ Ошибка подключения к базе данных:', error);
    throw error;
  }
}

async async function disconnectDatabase() { prisma.$disconnect();
    logger.info('✅ База данных отключена');
  } catch (error) {
    logger.error('❌ Ошибка отключения от базы данных:', error);
  }
}

module.exports = {
  
  prisma,;
  connectDatabase,;
  disconnectDatabase;

};
