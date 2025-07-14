const telegramService = require('../../../../backend/src/services/telegramService');

class UserHandler {
  // Обработка команды /start
  async handleStart(ctx) {
    try {
      const user = await telegramService.upsertUser(ctx.from);
      
      const welcomeMessage = `
🤖 Добро пожаловать в VendHub!

👤 Пользователь: ${user.firstName} ${user.lastName || ''}
🎭 Роль: ${this.getRoleText(user.role)}

Выберите действие из меню ниже:
`;
      
      await ctx.reply(welcomeMessage, this.getMainKeyboard(user.role));
      
      // Логируем действие
      await telegramService.logAction(user.id, 'START_COMMAND');
    } catch (error) {
      console.error('Ошибка в handleStart:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    }
  }

  // Получить основную клавиатуру по роли
  getMainKeyboard(role) {
    const keyboards = {
      ADMIN: [
        ['👥 Пользователи', '📊 Отчеты'],
        ['📋 Задачи', '🏭 Автоматы'],
        ['📚 Справочники', '⚙️ Настройки']
      ],
      MANAGER: [
        ['📋 Создать задачу', '📊 Отчеты'],
        ['🏭 Автоматы', '💰 Финансы'],
        ['📚 Справочники']
      ],
      WAREHOUSE: [
        ['📦 Склад', '🎒 Сумки'],
        ['📋 Мои задачи', '📊 Остатки']
      ],
      OPERATOR: [
        ['🗺️ Мой маршрут', '📋 Мои задачи'],
        ['💰 Инкассация', '🧹 Чистка']
      ],
      TECHNICIAN: [
        ['🔧 Ремонт', '📋 Мои задачи'],
        ['📊 Отчеты']
      ],
      DRIVER: [
        ['🚚 Маршруты', '⛽ Топливо'],
        ['📋 Мои задачи']
      ]
    };
    
    return {
      keyboard: keyboards[role] || keyboards.OPERATOR,
      resize_keyboard: true,
      one_time_keyboard: false
    };
  }

  // Получить текст роли
  getRoleText(role) {
    const roles = {
      ADMIN: 'Администратор',
      MANAGER: 'Менеджер',
      WAREHOUSE: 'Склад',
      OPERATOR: 'Оператор',
      TECHNICIAN: 'Техник',
      DRIVER: 'Водитель'
    };
    
    return roles[role] || 'Неизвестно';
  }

  // Обработка кнопки "Мои задачи"
  async handleMyTasks(ctx) {
    try {
      const user = await telegramService.getUserByTelegramId(ctx.from.id.toString());
      if (!user) {
        return await ctx.reply('❌ Пользователь не найден');
      }
      
      const tasks = await telegramService.getUserTasks(user.id, 'ASSIGNED');
      
      if (tasks.length === 0) {
        return await ctx.reply('📋 У вас нет активных задач');
      }
      
      let message = '📋 Ваши активные задачи:\n\n';
      
      tasks.forEach((task, index) => {
        message += `${index + 1}. ${task.title}\n`;
        message += `   🏭 ${task.machine.internalNumber} - ${task.machine.location?.name || 'Без локации'}\n`;
        message += `   📅 Срок: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Не указан'}\n\n`;
      });
      
      await ctx.reply(message);
    } catch (error) {
      console.error('Ошибка в handleMyTasks:', error);
      await ctx.reply('❌ Произошла ошибка при получении задач');
    }
  }
}

module.exports = new UserHandler();