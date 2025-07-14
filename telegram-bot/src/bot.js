/**
 * Основной файл VendHub Telegram бота
 */

const { Telegraf } = require('telegraf');
const Redis = require('redis');
const config = require('./config/bot');
const { BOT_STATES } = require('./fsm/states');
const { createInlineKeyboard, ROLE_KEYBOARDS } = require('./keyboards');

// Middleware
const authMiddleware = require('./middleware/auth');
const sessionMiddleware = require('./middleware/session');
const loggingMiddleware = require('./middleware/logging');

// Handlers
const commonHandlers = require('./handlers/common');
const operatorHandlers = require('./handlers/operator');
const warehouseHandlers = require('./handlers/warehouse');
const managerHandlers = require('./handlers/manager');
const technicianHandlers = require('./handlers/technician');
const mediaHandlers = require('./handlers/media');

// Services
const NotificationService = require('./services/notifications');
const apiService = require('./services/api');
const userService = require('./services/users');

// Utils
const logger = require('./utils/logger');
const { formatMessage } = require('./utils/formatters');

class VendHubBot {
  constructor() {
    this.bot = new Telegraf(config.telegram.token, config.telegram.options);
    this.redis = null;
    this.isRunning = false;
    this.notificationService = null;
    
    this.setupMiddleware();
    this.setupHandlers();
    this.setupErrorHandling();
  }

  /**
   * Настройка middleware
   */
  setupMiddleware() {
    // Redis сессии
    this.bot.use(sessionMiddleware());
    
    // Логирование
    this.bot.use(loggingMiddleware());
    
    // Авторизация пользователей
    this.bot.use(authMiddleware());
    
    // Инициализация FSM состояния
    this.bot.use(async (ctx, next) => {
      if (!ctx.session.state) {
        ctx.session.state = BOT_STATES.IDLE;
        ctx.session.data = {};
      }
      
      // Добавляем утилиты в контекст
      ctx.setState = (newState) => {
        logger.info(`User ${ctx.from.id} transition: ${ctx.session.state} -> ${newState}`);
        ctx.session.state = newState;
      };
      
      ctx.setData = (key, value) => {
        ctx.session.data[key] = value;
      };
      
      ctx.getData = (key) => {
        return ctx.session.data[key];
      };
      
      ctx.clearData = () => {
        ctx.session.data = {};
      };
      
      return next();
    });
  }

  /**
   * Настройка обработчиков команд
   */
  setupHandlers() {
    // Команда /start
    this.bot.start(async (ctx) => {
      logger.info(`Bot started by user: ${ctx.from.id} (@${ctx.from.username})`);
      
      try {
        if (!ctx.user) {
          return await this.handleUnauthorizedUser(ctx);
        }
        
        await this.showMainMenu(ctx);
      } catch (_error) {
        logger.error('Error in start command:', _error);
        await this.handleError(ctx, _error);
      }
    });

    // Команда /help
    this.bot.help(async (ctx) => {
      const helpText = this.getHelpText(ctx.user?.role);
      await ctx.reply(helpText, createInlineKeyboard([[
        { text: '🏠 Главное меню', callback_data: 'main_menu' }
      ]]));
    });

    // Команда /profile
    this.bot.command('profile', async (ctx) => {
      if (!ctx.user) {
        return await this.handleUnauthorizedUser(ctx);
      }
      
      await this.showProfile(ctx);
    });

    // Команда /status
    this.bot.command('status', async (ctx) => {
      if (!ctx.user) {
        return await this.handleUnauthorizedUser(ctx);
      }
      
      await this.showUserStatus(ctx);
    });

    // Подключение обработчиков по ролям
    commonHandlers(this.bot);
    operatorHandlers(this.bot);
    warehouseHandlers(this.bot);
    managerHandlers(this.bot);
    technicianHandlers(this.bot);
    mediaHandlers(this.bot);

    // Callback query обработчики
    this.setupCallbackHandlers();

    // Обработка текстовых сообщений
    this.bot.on('text', (ctx) => this.handleTextMessage(ctx));
    
    // Обработка фото сообщений
    this.bot.on('photo', (ctx) => this.handlePhotoMessage(ctx));
    
    // Обработка геолокации
    this.bot.on('location', (ctx) => this.handleLocationMessage(ctx));
  }

  /**
   * Настройка callback обработчиков
   */
  setupCallbackHandlers() {
    // Главное меню
    this.bot.action('main_menu', async (ctx) => {
      await ctx.answerCbQuery();
      await this.showMainMenu(ctx);
    });

    // Роутинг по ролям
    this.bot.action(/^(operator|warehouse|manager|technician)_menu$/, async (ctx) => {
      await ctx.answerCbQuery();
      const role = ctx.match[1].toUpperCase();
      
      if (ctx.user.role !== role && ctx.user.role !== 'ADMIN') {
        return await ctx.reply('❌ У вас нет доступа к этому разделу');
      }
      
      ctx.setState(`${role}_MENU`);
      await this.showRoleMenu(ctx, role);
    });

    // Профиль пользователя
    this.bot.action('profile', async (ctx) => {
      await ctx.answerCbQuery();
      await this.showProfile(ctx);
    });

    // Настройки
    this.bot.action('settings', async (ctx) => {
      await ctx.answerCbQuery();
      await this.showSettings(ctx);
    });
  }

  /**
   * Показать главное меню
   */
  async showMainMenu(ctx) {
    if (!ctx.user) {
      return await this.handleUnauthorizedUser(ctx);
    }

    ctx.setState(BOT_STATES.MAIN_MENU);
    
    const userRole = ctx.user.role;
    const keyboard = ROLE_KEYBOARDS[userRole] || ROLE_KEYBOARDS.OPERATOR;
    
    const welcomeMessage = formatMessage.welcome(ctx.user);
    
    try {
      if (ctx.callbackQuery) {
        await ctx.editMessageText(welcomeMessage, createInlineKeyboard(keyboard));
      } else {
        await ctx.reply(welcomeMessage, createInlineKeyboard(keyboard));
      }
    } catch (_error) {
      // Если редактирование не удалось, отправляем новое сообщение
      await ctx.reply(welcomeMessage, createInlineKeyboard(keyboard));
    }
  }

  /**
   * Показать меню по роли
   */
  async showRoleMenu(ctx, role) {
    const keyboard = ROLE_KEYBOARDS[role];
    const menuMessage = this.getRoleMenuMessage(role, ctx.user);
    
    try {
      await ctx.editMessageText(menuMessage, createInlineKeyboard(keyboard));
    } catch (_error) {
      await ctx.reply(menuMessage, createInlineKeyboard(keyboard));
    }
  }

  /**
   * Показать профиль пользователя
   */
  async showProfile(ctx) {
    const user = ctx.user;
    const profileText = formatMessage.userProfile(user);
    
    const keyboard = [
      [{ text: '⚙️ Настройки', callback_data: 'settings' }],
      [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
    ];
    
    if (ctx.callbackQuery) {
      await ctx.editMessageText(profileText, createInlineKeyboard(keyboard));
    } else {
      await ctx.reply(profileText, createInlineKeyboard(keyboard));
    }
  }

  /**
   * Показать настройки
   */
  async showSettings(ctx) {
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
      ...createInlineKeyboard(keyboard)
    });
  }

  /**
   * Показать статус пользователя
   */
  async showUserStatus(ctx) {
    try {
      // Получаем активные задачи пользователя
      const tasks = await apiService.getUserTasks(ctx.user.id);
      const statusMessage = formatMessage.userStatus(ctx.user, tasks);
      
      await ctx.reply(statusMessage, {
        parse_mode: 'Markdown',
        ...createInlineKeyboard([[
          { text: '🏠 Главное меню', callback_data: 'main_menu' }
        ]])
      });
    } catch (_error) {
      logger.error('Error getting user status:', _error);
      await ctx.reply('❌ Ошибка получения статуса');
    }
  }

  /**
   * Обработка неавторизованного пользователя
   */
  async handleUnauthorizedUser(ctx) {
    const message = '🔐 *Добро пожаловать в VendHub!*\n\n' +
      'Для работы с ботом необходимо пройти авторизацию.\n' +
      'Обратитесь к администратору для получения доступа.\n\n' +
      `👤 Ваш Telegram ID: \`${ctx.from.id}\`\n` +
      `📱 Username: @${ctx.from.username || 'не указан'}`;
    
    await ctx.reply(message, { parse_mode: 'Markdown' });
    
    // Уведомляем администраторов о новом пользователе
    await this.notifyAdminsAboutNewUser(ctx.from);
  }

  /**
   * Обработка текстовых сообщений
   */
  async handleTextMessage(ctx) {
    const state = ctx.session.state;
    const text = ctx.message.text;
    
    logger.info(`Text message in state ${state}: ${text}`);
    
    // FSM обработка в зависимости от текущего состояния
    switch (state) {
      case BOT_STATES.WEIGHT_INPUT:
        await this.handleWeightInput(ctx, text);
        break;
        
      case BOT_STATES.TEXT_INPUT:
        await this.handleTextInput(ctx, text);
        break;
        
      case BOT_STATES.NUMBER_INPUT:
        await this.handleNumberInput(ctx, text);
        break;
        
      case BOT_STATES.TASK_TITLE:
        await this.handleTaskTitleInput(ctx, text);
        break;
        
      case BOT_STATES.TASK_DESCRIPTION:
        await this.handleTaskDescriptionInput(ctx, text);
        break;
        
      default:
        // Общие команды
        if (text === '/menu' || text === 'Меню') {
          await this.showMainMenu(ctx);
        } else {
          await ctx.reply('🤔 Не понимаю. Используйте кнопки меню или команду /help для справки.');
        }
    }
  }

  /**
   * Обработка фото сообщений
   */
  async handlePhotoMessage(ctx) {
    const state = ctx.session.state;
    
    if (state === BOT_STATES.PHOTO_UPLOAD) {
      await this.handlePhotoUpload(ctx);
    } else {
      await ctx.reply('📸 Фото получено, но сейчас не требуется. Используйте соответствующие кнопки меню.');
    }
  }

  /**
   * Обработка геолокации
   */
  async handleLocationMessage(ctx) {
    const state = ctx.session.state;
    
    if (state === BOT_STATES.GPS_LOCATION) {
      await this.handleGPSLocation(ctx);
    } else {
      await ctx.reply('📍 Геолокация получена, но сейчас не требуется.');
    }
  }

  /**
   * Получить сообщение меню по роли
   */
  getRoleMenuMessage(role, user) {
    const messages = {
      OPERATOR: `👤 *Оператор ${user.firstName}*\n\nВыберите действие:`,
      WAREHOUSE: `📦 *Склад - ${user.firstName}*\n\nУправление складскими операциями:`,
      MANAGER: `👔 *Менеджер ${user.firstName}*\n\nУправление и контроль:`,
      TECHNICIAN: `🔧 *Техник ${user.firstName}*\n\nТехническое обслуживание:`,
      ADMIN: `⚡ *Администратор ${user.firstName}*\n\nПолный доступ к системе:`
    };
    
    return messages[role] || messages.OPERATOR;
  }

  /**
   * Получить текст справки по роли
   */
  getHelpText(role) {
    const helpTexts = {
      OPERATOR: '📋 *Справка для оператора*\n\n' +
        '• /tasks - мои задачи\n' +
        '• /return - возврат сумок\n' +
        '• /collect - инкассация\n' +
        '• /report - отчет за смену\n' +
        '• /status - текущий статус\n' +
        '• /help - эта справка',
        
      WAREHOUSE: '📦 *Справка для склада*\n\n' +
        '• /bags - управление сумками\n' +
        '• /inventory - проверка остатков\n' +
        '• /receive - прием возвратов\n' +
        '• /wash - мойка бункеров\n' +
        '• /status - текущий статус\n' +
        '• /help - эта справка',
        
      MANAGER: '👔 *Справка для менеджера*\n\n' +
        '• /create - создать задачу\n' +
        '• /assign - назначить задачу\n' +
        '• /analytics - аналитика\n' +
        '• /reports - отчеты\n' +
        '• /alerts - настройка уведомлений\n' +
        '• /help - эта справка'
    };
    
    return helpTexts[role] || helpTexts.OPERATOR;
  }

  /**
   * Настройка обработки ошибок
   */
  setupErrorHandling() {
    this.bot.catch(async (err, ctx) => {
      logger.error('Bot error:', err);
      await this.handleError(ctx, err);
    });

    // Обработка необработанных исключений
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      this.gracefulShutdown();
    });
  }

  /**
   * Обработка ошибок
   */
  async handleError(ctx, _error) {
    try {
      if (ctx && ctx.reply) {
        await ctx.reply('❌ Произошла ошибка. Попробуйте позже или обратитесь к администратору.');
      }
    } catch (replyError) {
      logger.error('Error sending error message:', replyError);
    }
  }

  /**
   * Уведомление администраторов о новом пользователе
   */
  async notifyAdminsAboutNewUser(telegramUser) {
    try {
      const adminUsers = await userService.getAdminUsers();
      const message = '🆕 *Новый пользователь*\n\n' +
        `👤 Имя: ${telegramUser.first_name} ${telegramUser.last_name || ''}\n` +
        `📱 Username: @${telegramUser.username || 'не указан'}\n` +
        `🆔 Telegram ID: \`${telegramUser.id}\`\n\n` +
        'Требуется предоставить доступ к системе.';

      for (const admin of adminUsers) {
        if (admin.telegramId) {
          try {
            await this.bot.telegram.sendMessage(admin.telegramId, message, {
              parse_mode: 'Markdown'
            });
          } catch (_error) {
            logger.error(`Failed to notify admin ${admin.id}:`, _error);
          }
        }
      }
    } catch (_error) {
      logger.error('Error notifying admins about new user:', _error);
    }
  }

  /**
   * Запуск бота
   */
  async start() {
    try {
      // Инициализация Redis
      if (config.redis.url) {
        this.redis = Redis.createClient({
          url: config.redis.url,
          password: config.redis.password
        });
        
        await this.redis.connect();
        logger.info('Redis connected successfully');
      }

      // Инициализация системы уведомлений
      this.notificationService = new NotificationService(this.bot);
      this.notificationService.initialize();
      logger.info('Notification service initialized');

      // Установка webhook или polling
      if (config.telegram.webhookUrl) {
        await this.bot.telegram.setWebhook(config.telegram.webhookUrl);
        logger.info(`Webhook set to: ${config.telegram.webhookUrl}`);
      } else {
        await this.bot.launch();
        logger.info('Bot started with polling');
      }

      this.isRunning = true;
      logger.info('VendHub Manager (VHM24) Telegram Bot started successfully');

      // Graceful shutdown
      process.once('SIGINT', () => this.gracefulShutdown());
      process.once('SIGTERM', () => this.gracefulShutdown());

    } catch (_error) {
      logger.error('Failed to start bot:', _error);
      process.exit(1);
    }
  }

  /**
   * Graceful остановка бота
   */
  async gracefulShutdown() {
    if (!this.isRunning) return;
    
    logger.info('Shutting down VendHub Bot...');
    this.isRunning = false;

    try {
      if (this.bot) {
        this.bot.stop('SIGTERM');
      }
      
      if (this.redis) {
        await this.redis.quit();
      }
      
      logger.info('VendHub Bot stopped gracefully');
      process.exit(0);
    } catch (_error) {
      logger.error('Error during shutdown:', _error);
      process.exit(1);
    }
  }

  // Placeholder методы для FSM обработчиков (будут реализованы в отдельных файлах)
  async handleWeightInput(_ctx, _text) { /* Реализация в handlers */ }
  async handleTextInput(_ctx, _text) { /* Реализация в handlers */ }
  async handleNumberInput(_ctx, _text) { /* Реализация в handlers */ }
  async handleTaskTitleInput(_ctx, _text) { /* Реализация в handlers */ }
  async handleTaskDescriptionInput(_ctx, _text) { /* Реализация в handlers */ }
  async handlePhotoUpload(_ctx) { /* Реализация в handlers */ }
  async handleGPSLocation(_ctx) { /* Реализация в handlers */ }
}

// Создаем и запускаем бота
const bot = new VendHubBot();

if (require.main === module) {
  bot.start().catch(console.error);
}

module.exports = bot;
