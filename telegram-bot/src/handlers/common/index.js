const { Markup } = require('telegraf');
const { BOT_STATES } = require('../../fsm/states');
const { ROLE_KEYBOARDS } = require('../../keyboards');
const logger = require('../../utils/logger');

/**
 * Регистрирует общие обработчики
 * @param {Object} bot - Экземпляр бота Telegraf
 */
const register = (bot) => {
  // Обработчик команды /start
  bot.command('start', async (ctx) => {
    try {
      await startHandler(ctx);
    } catch (error) {
      logger.error('Error in start command handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик команды /help
  bot.command('help', async (ctx) => {
    try {
      await helpHandler(ctx);
    } catch (error) {
      logger.error('Error in help command handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для возврата в главное меню
  bot.action('back_to_menu', async (ctx) => {
    try {
      // Получаем информацию о пользователе
      const user = ctx.user || { role: 'DEFAULT' };
      
      // Получаем клавиатуру в зависимости от роли пользователя
      const keyboard = ROLE_KEYBOARDS[user.role] || ROLE_KEYBOARDS.DEFAULT;
      
      // Отправляем сообщение с клавиатурой
      await ctx.editMessageText('🏠 *Главное меню*\n\nВыберите действие:', {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
      
      // Устанавливаем состояние бота
      if (ctx.scene && ctx.scene.enter) {
        await ctx.scene.enter(BOT_STATES.MAIN_MENU);
      }
      
      logger.info(`User ${ctx.from.id} returned to main menu`);
    } catch (error) {
      logger.error('Error in back_to_menu action handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик команды /profile
  bot.command('profile', async (ctx) => {
    try {
      // Проверяем, авторизован ли пользователь
      if (!ctx.user) {
        await ctx.reply('❌ Необходима авторизация для просмотра профиля');
        return;
      }
      
      // Формируем сообщение с информацией о профиле
      const message = `👤 *Ваш профиль*\n\n` +
        `*Имя:* ${ctx.user.firstName || 'Не указано'}\n` +
        `*Фамилия:* ${ctx.user.lastName || 'Не указано'}\n` +
        `*Роль:* ${getRoleText(ctx.user.role)}\n` +
        `*Статус:* ${getStatusText(ctx.user.status)}`;
      
      // Создаем клавиатуру для профиля
      const keyboard = [
        [
          Markup.button.callback('⚙️ Настройки', 'settings'),
          Markup.button.callback('🔐 Сменить пароль', 'change_password')
        ],
        [Markup.button.callback('🏠 Главное меню', 'back_to_menu')]
      ];
      
      await ctx.replyWithMarkdown(message, Markup.inlineKeyboard(keyboard));
      
      logger.info(`User ${ctx.from.id} viewed profile`);
    } catch (error) {
      logger.error('Error in profile command handler:', error);
      await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });
  
  // Обработчик для неизвестных команд
  bot.on('text', async (ctx, next) => {
    // Если это команда
    if (ctx.message.text.startsWith('/')) {
      try {
        await unknownCommandHandler(ctx);
      } catch (error) {
        logger.error('Error in unknown command handler:', error);
        await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
      }
    } else {
      // Если это не команда, передаем управление следующему обработчику
      return next();
    }
  });
  
  logger.info('Common handlers registered');
};

// Обработчик команды /start
const startHandler = async (ctx) => {
  try {
    // Получаем информацию о пользователе
    const user = ctx.user || { role: 'DEFAULT' };
    
    // Приветственное сообщение
    const welcomeMessage = `👋 Привет, ${ctx.from.first_name}!
    
🤖 Я бот системы VendHub для управления вендинговыми автоматами.

Выберите действие из меню ниже:`;
    
    // Получаем клавиатуру в зависимости от роли пользователя
    const keyboard = ROLE_KEYBOARDS[user.role] || ROLE_KEYBOARDS.DEFAULT;
    
    // Отправляем сообщение с клавиатурой
    await ctx.reply(welcomeMessage, Markup.inlineKeyboard(keyboard));
    
    // Устанавливаем состояние бота
    if (ctx.scene && ctx.scene.enter) {
      await ctx.scene.enter(BOT_STATES.MAIN_MENU);
    }
    
    logger.info(`User ${ctx.from.id} started the bot`);
  } catch (error) {
    logger.error('Error in start handler:', error);
    await ctx.reply('❌ Произошла ошибка при запуске бота. Пожалуйста, попробуйте позже.');
  }
};

// Обработчик команды /help
const helpHandler = async (ctx) => {
  try {
    const helpMessage = `📚 *Справка по использованию бота*
    
Основные команды:
/start - Запустить бота и показать главное меню
/help - Показать эту справку
/profile - Показать информацию о вашем профиле
/tasks - Показать ваши текущие задачи

Если у вас возникли проблемы, обратитесь к администратору системы.`;
    
    await ctx.replyWithMarkdown(helpMessage);
    logger.info(`User ${ctx.from.id} requested help`);
  } catch (error) {
    logger.error('Error in help handler:', error);
    await ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
  }
};

// Обработчик неизвестных команд
const unknownCommandHandler = async (ctx) => {
  try {
    await ctx.reply('❓ Неизвестная команда. Используйте /help для получения списка доступных команд.');
    logger.warn(`User ${ctx.from.id} used unknown command: ${ctx.message.text}`);
  } catch (error) {
    logger.error('Error in unknown command handler:', error);
  }
};

// Вспомогательная функция для получения текстового представления роли
const getRoleText = (role) => {
  const roleMap = {
    'ADMIN': '👑 Администратор',
    'MANAGER': '📊 Менеджер',
    'OPERATOR': '👨‍💼 Оператор',
    'WAREHOUSE': '📦 Склад',
    'TECHNICIAN': '🔧 Техник',
    'USER': '👤 Пользователь'
  };
  
  return roleMap[role] || role;
};

// Вспомогательная функция для получения текстового представления статуса
const getStatusText = (status) => {
  const statusMap = {
    'ACTIVE': '✅ Активен',
    'INACTIVE': '❌ Неактивен',
    'PENDING': '⏳ Ожидает подтверждения',
    'BLOCKED': '🚫 Заблокирован'
  };
  
  return statusMap[status] || status;
};

module.exports = {
  startHandler,
  helpHandler,
  unknownCommandHandler,
  register
};
