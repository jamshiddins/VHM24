const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class TelegramService {
  // Получить пользователя по Telegram ID
  async getUserByTelegramId(telegramId) {
    return await prisma.user.findUnique({
      where: { telegramId: telegramId.toString() }
    });
  }

  // Создать или обновить пользователя
  async upsertUser(telegramUser) {
    const { id, first_name, last_name, username } = telegramUser;
    
    return await prisma.user.upsert({
      where: { telegramId: id.toString() },
      update: {
        firstName: first_name,
        lastName: last_name,
        username
      },
      create: {
        telegramId: id.toString(),
        firstName: first_name,
        lastName: last_name,
        username,
        role: 'OPERATOR'
      }
    });
  }

  // Получить задачи пользователя
  async getUserTasks(userId, status = null) {
    const where = { assignedToId: userId };
    if (status) where.status = status;
    
    return await prisma.task.findMany({
      where,
      include: {
        machine: {
          include: { location: true }
        },
        checklists: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Логирование действий
  async logAction(userId, action, details = {}) {
    return await prisma.actionLog.create({
      data: {
        userId,
        action,
        details,
        timestamp: new Date()
      }
    });
  }
}

module.exports = new TelegramService();