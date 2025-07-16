const { Telegraf } = require('telegraf');
const Redis = require('redis');
const config = require('./config/bot');
const { BOT_STATES } = require('./fsm/states');
const { createInlineKeyboard, ROLE_KEYBOARDS } = require('./keyboards');
const authMiddleware = require('./middleware/auth');
const sessionMiddleware = require('./middleware/session');
const loggingMiddleware = require('./middleware/logging');
const commonHandlers = require('./handlers/common');
const operatorHandlers = require('./handlers/operator');
const warehouseHandlers = require('./handlers/warehouse');
const managerHandlers = require('./handlers/manager');
const technicianHandlers = require('./handlers/technician');
const mediaHandlers = require('./handlers/media');
const NotificationService = require('./services/notifications');
const apiService = require('./services/api');
const userService = require('./services/users');
const logger = require('./utils/logger');
const { formatMessage } = require('./utils/formatters');

class VendHubBot {
  constructor() {
    this.bot = null;
    this.redisClient = null;
    this.notificationService = null;
  }

  async start() {
    try {
      // Инициализация бота
      this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
      
      // Подключение к Redis
      this.redisClient = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      
      await this.redisClient.connect();
      logger.info('Redis connected successfully');
      
      // Инициализация сервиса уведомлений
      this.notificationService = new NotificationService(this.bot);
      await this.notificationService.init();
      logger.info('Notification service initialized');
      
      // Подключение middleware
      this.bot.use(loggingMiddleware);
      this.bot.use(sessionMiddleware(this.redisClient));
      this.bot.use(authMiddleware);
      
    // Регистрация обработчиков
    this.registerHandlers();
    
    // Создание централизованного обработчика ошибок
    this.setupErrorHandling();
      
      // Запуск бота
      await this.bot.launch();
      logger.info('Bot started with polling');
      logger.info('VendHub Manager (VHM24) Telegram Bot started successfully');
      
      // Обработка сигналов завершения
      process.once('SIGINT', () => this.stop());
      process.once('SIGTERM', () => this.stop());
      
      return true;
    } catch (error) {
      logger.error('Failed to start bot:', error);
      return false;
    }
  }
  
  registerHandlers() {
    // Функция для проверки роли
    const requireRole = (roles) => {
      return async (ctx, next) => {
        if (!ctx.user) return await this.sendAuthRequest(ctx);
        
        if (Array.isArray(roles) ? (roles.includes(ctx.user.role) || ctx.user.role === 'ADMIN') : (ctx.user.role === roles || ctx.user.role === 'ADMIN')) {
          return await next();
        } else {
          return await ctx.reply('❌ У вас нет доступа к этому разделу');
        }
      };
    };
    
    // Регистрация общих обработчиков
    commonHandlers.register(this.bot);
    
    // Регистрация обработчиков для разных ролей
    operatorHandlers.register(this.bot, requireRole);
    warehouseHandlers.register(this.bot, requireRole);
    managerHandlers.register(this.bot, requireRole);
    technicianHandlers.register(this.bot, requireRole);
    mediaHandlers.register(this.bot, requireRole);
    
    // Обработка действия "main_menu"
    this.bot.action('main_menu', async (ctx) => {
      if (!ctx.user) return await this.sendAuthRequest(ctx);
      
      try {
        await this.handleMainMenu(ctx);
      } catch (error) {
        await this.handleError(ctx, error);
      }
    });
    
    // Обработка действия "settings"
    this.bot.action('settings', async (ctx) => {
      if (!ctx.user) return await this.sendAuthRequest(ctx);
      
      try {
        const settingsText = '⚙️ *Настройки бота*\n\n' +
          '• 🔔 Уведомления: включены\n' +
          '• 🌍 Язык: Русский\n' +
          '• 🔊 Звуки: включены\n' +
          '• 📍 Геолокация: разрешена';
        
        const keyboard = [
          [{ text: '🔔 Уведомления', callback_data: 'settings_notifications' }],
          [{ text: '🌍 Язык', callback_data: 'settings_language' }],
          [{ text: '🔊 Звуки', callback_data: 'settings_sounds' }],
          [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
        ];
        
        await ctx.editMessageText(settingsText, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: keyboard
          }
        });
      } catch (error) {
        await this.handleError(ctx, error);
      }
    });
    
    // Обработка фото
    this.bot.on('photo', async (ctx) => {
      if (!ctx.user) return await this.sendAuthRequest(ctx);
      
      try {
        // Проверяем, ожидается ли фото в текущем состоянии
        if (ctx.session && ctx.session.awaitingPhoto) {
          const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
          
          // Сохраняем ID фото в сессии
          ctx.session.photoId = photoId;
          
          await ctx.reply('✅ Фото успешно получено и сохранено');
          
          // Сбрасываем флаг ожидания фото
          ctx.session.awaitingPhoto = false;
        } else {
          await ctx.reply('📸 Фото получено, но сейчас не требуется. Используйте соответствующие кнопки меню.');
        }
      } catch (error) {
        logger.error('Error handling photo:', error);
        await ctx.reply('❌ Произошла ошибка при обработке фото. Пожалуйста, попробуйте позже.');
      }
    });
    
    // Обработка геолокации
    this.bot.on('location', async (ctx) => {
      if (!ctx.user) return await this.sendAuthRequest(ctx);
      
      try {
        // Проверяем, ожидается ли геолокация в текущем состоянии
        if (ctx.session && ctx.session.awaitingLocation) {
          const { latitude, longitude } = ctx.message.location;
          
          // Сохраняем координаты в сессии
          ctx.session.location = { latitude, longitude };
          
          await ctx.reply('✅ Геолокация успешно получена и сохранена');
          
          // Сбрасываем флаг ожидания геолокации
          ctx.session.awaitingLocation = false;
        } else {
          await ctx.reply('📍 Геолокация получена, но сейчас не требуется.');
        }
      } catch (error) {
        logger.error('Error handling location:', error);
        await ctx.reply('❌ Произошла ошибка при обработке геолокации. Пожалуйста, попробуйте позже.');
      }
    });
    
    logger.info('All handlers registered successfully');
  }
  
  /**
   * Настраивает централизованную обработку ошибок
   */
  setupErrorHandling() {
    // Обработка ошибок бота
    this.bot.catch(async (error, ctx) => {
      logger.error('Bot error:', error);
      
      // Отправляем уведомление администраторам о критической ошибке
      try {
        const errorMessage = `🚨 *КРИТИЧЕСКАЯ ОШИБКА*\n\n` +
          `*Пользователь:* ${ctx.from?.id || 'Неизвестно'}\n` +
          `*Действие:* ${ctx.callbackQuery?.data || ctx.message?.text || 'Неизвестно'}\n` +
          `*Ошибка:* ${error.message}\n` +
          `*Стек:* ${error.stack?.substring(0, 200) || 'Недоступно'}`;
        
        await this.notificationService.notifyAdmins(errorMessage, { parse_mode: 'Markdown' });
      } catch (notifyError) {
        logger.error('Error notifying admins about critical error:', notifyError);
      }
      
      // Отправляем сообщение пользователю
      try {
        await ctx.reply('❌ Произошла ошибка. Попробуйте позже или обратитесь к администратору.');
      } catch (replyError) {
        logger.error('Error sending error message to user:', replyError);
      }
    });
    
    // Обработка необработанных отклонений промисов
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      
      // Отправляем уведомление администраторам
      try {
        const errorMessage = `🚨 *НЕОБРАБОТАННОЕ ОТКЛОНЕНИЕ ПРОМИСА*\n\n` +
          `*Причина:* ${reason}\n` +
          `*Промис:* ${promise}`;
        
        this.notificationService.notifyAdmins(errorMessage, { parse_mode: 'Markdown' });
      } catch (error) {
        logger.error('Error notifying admins about unhandled rejection:', error);
      }
    });
    
    // Обработка необработанных исключений
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      
      // Отправляем уведомление администраторам
      try {
        const errorMessage = `🚨 *НЕОБРАБОТАННОЕ ИСКЛЮЧЕНИЕ*\n\n` +
          `*Ошибка:* ${error.message}\n` +
          `*Стек:* ${error.stack?.substring(0, 200) || 'Недоступно'}`;
        
        this.notificationService.notifyAdmins(errorMessage, { parse_mode: 'Markdown' });
      } catch (notifyError) {
        logger.error('Error notifying admins about uncaught exception:', notifyError);
      }
    });
    
    logger.info('Error handling system set up successfully');
  }
  
  async handleMainMenu(ctx) {
    try {
      // Получаем клавиатуру в зависимости от роли пользователя
      const keyboard = ROLE_KEYBOARDS[ctx.user.role] || ROLE_KEYBOARDS.DEFAULT;
      
      // Отправляем сообщение с клавиатурой
      await ctx.editMessageText('🏠 *Главное меню*\n\nВыберите действие:', {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
      
      // Устанавливаем состояние FSM
      ctx.setState(BOT_STATES.MAIN_MENU);
    } catch (error) {
      await this.handleError(ctx, error);
    }
  }
  
  async sendAuthRequest(ctx) {
    try {
      const telegramUser = ctx.from;
      
      // Отправляем сообщение о необходимости авторизации
      const message = '🔐 *Добро пожаловать в VendHub!*\n\n' +
        'Для работы с ботом необходимо пройти авторизацию.\n' +
        'Обратитесь к администратору для получения доступа.\n\n' +
        `📱 Username: @${telegramUser.username || 'не указан'}`;
      
      await ctx.reply(message, { parse_mode: 'Markdown' });
      
      // Уведомляем администраторов о новом пользователе
      try {
        const adminMessage = '🆕 *Новый пользователь*\n\n' +
          `👤 Имя: ${telegramUser.first_name} ${telegramUser.last_name || ''}` +
          `📱 Username: @${telegramUser.username || 'не указан'}` +
          'Требуется предоставить доступ к системе.';
        
        await this.notificationService.notifyAdmins(adminMessage, {
          parse_mode: 'Markdown'
        });
      } catch (error) {
        logger.error('Error notifying admins about new user:', error);
      }
    } catch (error) {
      await this.handleError(ctx, error);
    }
  }
  
  async handleError(ctx, error) {
    logger.error('Error handling request:', error);
    try {
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже или обратитесь к администратору.');
    } catch (replyError) {
      logger.error('Error sending error message:', replyError);
    }
  }
  
  async stop() {
    logger.info('Shutting down VendHub Bot...');
    try {
      // Останавливаем бота
      if (this.bot) {
        this.bot.stop('SIGTERM');
      }
      
      // Закрываем соединение с Redis
      if (this.redisClient) {
        await this.redisClient.quit();
      }
      
      logger.info('VendHub Bot stopped gracefully');
    } catch (error) {
      logger.error('Error during shutdown:', error);
    }
  }
}

module.exports = new VendHubBot();
