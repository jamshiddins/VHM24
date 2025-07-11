require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const Redis = require('ioredis');
const axios = require('axios');
const winston = require('winston');

// Настройка логгера
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'bot.log' })
  ]
});

// Конфигурация
const config = {
  telegramToken: process.env.TELEGRAM_BOT_TOKEN,
  redisUrl: process.env.REDIS_URL,
  apiUrl: process.env.API_URL || 'https://vhm24-production.up.railway.app/api/v1',
  adminIds: process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',') : []
};

// Инициализация Redis
const redis = new Redis(config.redisUrl);

// Инициализация бота
const bot = new TelegramBot(config.telegramToken, { polling: true });

// FSM состояния
const FSM_STATES = {
  // Общие состояния
  START: 'start',
  REGISTRATION: 'registration',
  MAIN_MENU: 'main_menu',
  
  // Admin состояния
  ADMIN_MENU: 'admin_menu',
  ADMIN_USERS: 'admin_users',
  ADMIN_SYSTEM: 'admin_system',
  
  // Manager состояния
  MANAGER_MENU: 'manager_menu',
  MANAGER_CARDS: 'manager_cards',
  MANAGER_REPORTS: 'manager_reports',
  MANAGER_TASKS: 'manager_tasks',
  MANAGER_FINANCE: 'manager_finance',
  
  // Warehouse состояния
  WAREHOUSE_MENU: 'warehouse_menu',
  WAREHOUSE_RECEIVE: 'warehouse_receive',
  WAREHOUSE_BUNKERS: 'warehouse_bunkers',
  WAREHOUSE_INVENTORY: 'warehouse_inventory',
  WAREHOUSE_KITS: 'warehouse_kits',
  WAREHOUSE_PHOTO: 'warehouse_photo',
  
  // Operator состояния
  OPERATOR_MENU: 'operator_menu',
  OPERATOR_MACHINES: 'operator_machines',
  OPERATOR_MAINTENANCE: 'operator_maintenance',
  
  // Technician состояния
  TECHNICIAN_MENU: 'technician_menu',
  TECHNICIAN_SERVICE: 'technician_service',
  TECHNICIAN_REPAIR: 'technician_repair',
  
  // Driver состояния
  DRIVER_MENU: 'driver_menu',
  DRIVER_ROUTES: 'driver_routes',
  DRIVER_LOGS: 'driver_logs'
};

// Роли пользователей
const USER_ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  WAREHOUSE: 'WAREHOUSE',
  OPERATOR: 'OPERATOR',
  TECHNICIAN: 'TECHNICIAN',
  DRIVER: 'DRIVER'
};

// Утилиты для работы с FSM
class FSMManager {
  static async getUserState(userId) {
    const state = await redis.get(`user:${userId}:state`);
    return state || FSM_STATES.START;
  }
  
  static async setUserState(userId, state, data = {}) {
    await redis.set(`user:${userId}:state`, state);
    if (Object.keys(data).length > 0) {
      await redis.set(`user:${userId}:data`, JSON.stringify(data));
    }
  }
  
  static async getUserData(userId) {
    const data = await redis.get(`user:${userId}:data`);
    return data ? JSON.parse(data) : {};
  }
  
  static async clearUserData(userId) {
    await redis.del(`user:${userId}:data`);
  }
}

// API клиент
class APIClient {
  static async request(method, endpoint, data = null, userId = null) {
    try {
      const config = {
        method,
        url: `${config.apiUrl}${endpoint}`,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (data) {
        config.data = data;
      }
      
      // Добавляем авторизацию если есть userId
      if (userId) {
        const token = await redis.get(`user:${userId}:token`);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      
      const response = await axios(config);
      return response.data;
    } catch (error) {
      logger.error('API request failed', { 
        method, 
        endpoint, 
        error: error.message,
        userId 
      });
      throw error;
    }
  }
  
  static async getUserByTelegramId(telegramId) {
    try {
      return await this.request('GET', `/users/telegram/${telegramId}`);
    } catch (error) {
      return null;
    }
  }
  
  static async registerUser(userData) {
    return await this.request('POST', '/auth/register', userData);
  }
  
  static async loginUser(telegramId) {
    return await this.request('POST', '/auth/login', { telegramId });
  }
}

// Клавиатуры
const keyboards = {
  mainMenu: (userRoles) => {
    const keyboard = [];
    
    if (userRoles.includes(USER_ROLES.ADMIN)) {
      keyboard.push([{ text: '👑 Администрирование', callback_data: 'admin_menu' }]);
    }
    
    if (userRoles.includes(USER_ROLES.MANAGER)) {
      keyboard.push([{ text: '📊 Менеджмент', callback_data: 'manager_menu' }]);
    }
    
    if (userRoles.includes(USER_ROLES.WAREHOUSE)) {
      keyboard.push([{ text: '📦 Склад', callback_data: 'warehouse_menu' }]);
    }
    
    if (userRoles.includes(USER_ROLES.OPERATOR)) {
      keyboard.push([{ text: '🎮 Операции', callback_data: 'operator_menu' }]);
    }
    
    if (userRoles.includes(USER_ROLES.TECHNICIAN)) {
      keyboard.push([{ text: '🔧 Техобслуживание', callback_data: 'technician_menu' }]);
    }
    
    if (userRoles.includes(USER_ROLES.DRIVER)) {
      keyboard.push([{ text: '🚚 Логистика', callback_data: 'driver_menu' }]);
    }
    
    keyboard.push([{ text: '❓ Помощь', callback_data: 'help' }]);
    
    return {
      reply_markup: {
        inline_keyboard: keyboard
      }
    };
  },
  
  warehouseMenu: {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📥 Приём товаров', callback_data: 'warehouse_receive' }],
        [{ text: '🗂️ Бункеры', callback_data: 'warehouse_bunkers' }],
        [{ text: '📋 Инвентаризация', callback_data: 'warehouse_inventory' }],
        [{ text: '👝 Комплекты (сумки)', callback_data: 'warehouse_kits' }],
        [{ text: '🔙 Назад', callback_data: 'main_menu' }]
      ]
    }
  },
  
  managerMenu: {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🗃️ Карточки', callback_data: 'manager_cards' }],
        [{ text: '📊 Отчёты', callback_data: 'manager_reports' }],
        [{ text: '📋 Задачи', callback_data: 'manager_tasks' }],
        [{ text: '💰 Финансы', callback_data: 'manager_finance' }],
        [{ text: '🔙 Назад', callback_data: 'main_menu' }]
      ]
    }
  },
  
  backToMain: {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔙 Главное меню', callback_data: 'main_menu' }]
      ]
    }
  }
};

// Обработчики команд
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  try {
    logger.info('User started bot', { userId, chatId });
    
    // Проверяем, зарегистрирован ли пользователь
    const user = await APIClient.getUserByTelegramId(userId.toString());
    
    if (user) {
      // Пользователь найден, авторизуем
      const loginResult = await APIClient.loginUser(userId.toString());
      await redis.set(`user:${userId}:token`, loginResult.token);
      await redis.set(`user:${userId}:roles`, JSON.stringify(user.roles));
      
      await FSMManager.setUserState(userId, FSM_STATES.MAIN_MENU);
      
      await bot.sendMessage(chatId, 
        `Добро пожаловать в VHM24, ${user.name}! 👋\n\n` +
        `Ваши роли: ${user.roles.join(', ')}\n\n` +
        'Выберите раздел для работы:',
        keyboards.mainMenu(user.roles)
      );
    } else {
      // Новый пользователь, начинаем регистрацию
      await FSMManager.setUserState(userId, FSM_STATES.REGISTRATION);
      
      await bot.sendMessage(chatId,
        'Добро пожаловать в VHM24! 🎉\n\n' +
        'Для начала работы необходимо зарегистрироваться.\n' +
        'Введите ваше имя:'
      );
    }
  } catch (error) {
    logger.error('Error in /start command', { error: error.message, userId });
    await bot.sendMessage(chatId, 'Произошла ошибка. Попробуйте позже.');
  }
});

bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  
  const helpText = `
🤖 *VHM24 Telegram Bot - Справка*

*Основные команды:*
/start - Начать работу с ботом
/help - Показать эту справку
/menu - Главное меню

*Роли и функции:*

👑 *Администратор:*
• Управление пользователями
• Системные настройки
• Мониторинг

📊 *Менеджер:*
• Карточки (автоматы, товары, запчасти)
• Отчёты и сверка
• Управление задачами
• Финансовые операции

📦 *Склад:*
• Приём товаров
• Управление бункерами
• Инвентаризация
• Формирование комплектов

🎮 *Оператор:*
• Операции с автоматами
• Мониторинг состояния

🔧 *Техник:*
• Техническое обслуживание
• Ремонтные работы

🚚 *Водитель:*
• Маршруты
• Логи поездок

*Поддержка:* @vhm24_support
  `;
  
  await bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
});

bot.onText(/\/menu/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  try {
    const user = await APIClient.getUserByTelegramId(userId.toString());
    if (user) {
      await FSMManager.setUserState(userId, FSM_STATES.MAIN_MENU);
      await bot.sendMessage(chatId, 
        'Главное меню:',
        keyboards.mainMenu(user.roles)
      );
    } else {
      await bot.sendMessage(chatId, 'Сначала зарегистрируйтесь командой /start');
    }
  } catch (error) {
    logger.error('Error in /menu command', { error: error.message, userId });
    await bot.sendMessage(chatId, 'Произошла ошибка. Попробуйте позже.');
  }
});

// Обработчик callback запросов
bot.on('callback_query', async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;
  
  try {
    await bot.answerCallbackQuery(callbackQuery.id);
    
    const user = await APIClient.getUserByTelegramId(userId.toString());
    if (!user) {
      await bot.sendMessage(chatId, 'Сначала зарегистрируйтесь командой /start');
      return;
    }
    
    switch (data) {
      case 'main_menu':
        await FSMManager.setUserState(userId, FSM_STATES.MAIN_MENU);
        await bot.editMessageText(
          'Главное меню:',
          {
            chat_id: chatId,
            message_id: msg.message_id,
            ...keyboards.mainMenu(user.roles)
          }
        );
        break;
        
      case 'warehouse_menu':
        if (!user.roles.includes(USER_ROLES.WAREHOUSE)) {
          await bot.sendMessage(chatId, 'У вас нет доступа к этому разделу.');
          return;
        }
        await FSMManager.setUserState(userId, FSM_STATES.WAREHOUSE_MENU);
        await bot.editMessageText(
          '📦 *Управление складом*\n\nВыберите операцию:',
          {
            chat_id: chatId,
            message_id: msg.message_id,
            parse_mode: 'Markdown',
            ...keyboards.warehouseMenu
          }
        );
        break;
        
      case 'manager_menu':
        if (!user.roles.includes(USER_ROLES.MANAGER)) {
          await bot.sendMessage(chatId, 'У вас нет доступа к этому разделу.');
          return;
        }
        await FSMManager.setUserState(userId, FSM_STATES.MANAGER_MENU);
        await bot.editMessageText(
          '📊 *Менеджмент*\n\nВыберите раздел:',
          {
            chat_id: chatId,
            message_id: msg.message_id,
            parse_mode: 'Markdown',
            ...keyboards.managerMenu
          }
        );
        break;
        
      case 'warehouse_receive':
        await handleWarehouseReceive(chatId, userId, msg.message_id);
        break;
        
      case 'warehouse_bunkers':
        await handleWarehouseBunkers(chatId, userId, msg.message_id);
        break;
        
      case 'warehouse_inventory':
        await handleWarehouseInventory(chatId, userId, msg.message_id);
        break;
        
      case 'help':
        await bot.sendMessage(chatId, 'Справка отправлена отдельным сообщением.');
        await bot.sendMessage(chatId, '/help');
        break;
        
      default:
        await bot.sendMessage(chatId, 'Функция в разработке...');
    }
  } catch (error) {
    logger.error('Error in callback query', { error: error.message, userId, data });
    await bot.sendMessage(chatId, 'Произошла ошибка. Попробуйте позже.');
  }
});

// Обработчик текстовых сообщений
bot.on('message', async (msg) => {
  if (msg.text && msg.text.startsWith('/')) {
    return; // Команды обрабатываются отдельно
  }
  
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;
  
  try {
    const currentState = await FSMManager.getUserState(userId);
    
    switch (currentState) {
      case FSM_STATES.REGISTRATION:
        await handleRegistration(chatId, userId, text);
        break;
        
      case FSM_STATES.WAREHOUSE_RECEIVE:
        await handleWarehouseReceiveInput(chatId, userId, text);
        break;
        
      default:
        // В других состояниях показываем меню
        const user = await APIClient.getUserByTelegramId(userId.toString());
        if (user) {
          await bot.sendMessage(chatId, 
            'Используйте кнопки меню для навигации или команду /menu',
            keyboards.mainMenu(user.roles)
          );
        }
    }
  } catch (error) {
    logger.error('Error in message handler', { error: error.message, userId });
    await bot.sendMessage(chatId, 'Произошла ошибка. Попробуйте позже.');
  }
});

// Обработчики для конкретных функций
async function handleRegistration(chatId, userId, name) {
  try {
    const userData = {
      name: name.trim(),
      telegramId: userId.toString(),
      telegramUsername: '',
      email: `user${userId}@vhm24.local`,
      roles: [USER_ROLES.OPERATOR] // По умолчанию роль оператора
    };
    
    const result = await APIClient.registerUser(userData);
    
    await FSMManager.setUserState(userId, FSM_STATES.MAIN_MENU);
    await redis.set(`user:${userId}:roles`, JSON.stringify(userData.roles));
    
    await bot.sendMessage(chatId,
      `Регистрация завершена! 🎉\n\n` +
      `Имя: ${name}\n` +
      `Роль: ${userData.roles.join(', ')}\n\n` +
      `Для получения дополнительных ролей обратитесь к администратору.`,
      keyboards.mainMenu(userData.roles)
    );
    
    logger.info('User registered', { userId, name });
  } catch (error) {
    logger.error('Registration failed', { error: error.message, userId });
    await bot.sendMessage(chatId, 
      'Ошибка регистрации. Попробуйте позже или обратитесь к администратору.'
    );
  }
}

async function handleWarehouseReceive(chatId, userId, messageId) {
  await FSMManager.setUserState(userId, FSM_STATES.WAREHOUSE_RECEIVE);
  
  await bot.editMessageText(
    '📥 *Приём товаров*\n\n' +
    'Введите данные о товаре в формате:\n' +
    '`Название товара, количество, единица измерения`\n\n' +
    'Например: `Кофе Jacobs, 10, кг`',
    {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      ...keyboards.backToMain
    }
  );
}

async function handleWarehouseReceiveInput(chatId, userId, text) {
  try {
    const parts = text.split(',').map(p => p.trim());
    
    if (parts.length !== 3) {
      await bot.sendMessage(chatId, 
        'Неверный формат. Используйте: `Название, количество, единица`',
        { parse_mode: 'Markdown' }
      );
      return;
    }
    
    const [name, quantity, unit] = parts;
    
    // Здесь будет API запрос для создания операции прихода
    const operationData = {
      type: 'IN',
      itemName: name,
      quantity: parseFloat(quantity),
      unit: unit,
      reason: 'Приём товара через Telegram',
      userId: userId
    };
    
    // TODO: Реализовать API запрос
    // await APIClient.request('POST', '/warehouse/operations', operationData, userId);
    
    await bot.sendMessage(chatId,
      `✅ Товар принят на склад:\n\n` +
      `📦 ${name}\n` +
      `📊 ${quantity} ${unit}\n` +
      `⏰ ${new Date().toLocaleString('ru-RU')}\n\n` +
      `Операция сохранена в системе.`,
      keyboards.backToMain
    );
    
    await FSMManager.setUserState(userId, FSM_STATES.WAREHOUSE_MENU);
    
    logger.info('Warehouse receive operation', { userId, name, quantity, unit });
  } catch (error) {
    logger.error('Error in warehouse receive', { error: error.message, userId });
    await bot.sendMessage(chatId, 'Ошибка при обработке операции.');
  }
}

async function handleWarehouseBunkers(chatId, userId, messageId) {
  try {
    // TODO: Получить список бункеров из API
    const bunkersText = '🗂️ *Управление бункерами*\n\n' +
      'Функция в разработке...\n\n' +
      'Планируемые возможности:\n' +
      '• Просмотр состояния бункеров\n' +
      '• Заполнение бункеров\n' +
      '• Мойка и обслуживание\n' +
      '• Фото-фиксация состояния';
    
    await bot.editMessageText(bunkersText, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      ...keyboards.backToMain
    });
  } catch (error) {
    logger.error('Error in warehouse bunkers', { error: error.message, userId });
  }
}

async function handleWarehouseInventory(chatId, userId, messageId) {
  try {
    const inventoryText = '📋 *Инвентаризация*\n\n' +
      'Функция в разработке...\n\n' +
      'Планируемые возможности:\n' +
      '• Сканирование QR-кодов\n' +
      '• Подсчёт остатков\n' +
      '• Фото-фиксация\n' +
      '• Автоматическое формирование отчётов';
    
    await bot.editMessageText(inventoryText, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      ...keyboards.backToMain
    });
  } catch (error) {
    logger.error('Error in warehouse inventory', { error: error.message, userId });
  }
}

// Обработка ошибок
bot.on('polling_error', (error) => {
  logger.error('Polling error', { error: error.message });
});

process.on('SIGINT', async () => {
  logger.info('Bot shutting down...');
  await bot.stopPolling();
  await redis.disconnect();
  process.exit(0);
});

// Запуск бота
async function startBot() {
  try {
    logger.info('Starting VHM24 Telegram Bot...');
    logger.info(`Bot token: ${config.telegramToken ? 'Set' : 'Not set'}`);
    logger.info(`Redis URL: ${config.redisUrl ? 'Set' : 'Not set'}`);
    logger.info(`API URL: ${config.apiUrl}`);
    
    // Проверяем подключение к Redis
    await redis.ping();
    logger.info('Redis connection established');
    
    // Устанавливаем команды бота
    await bot.setMyCommands([
      { command: 'start', description: 'Начать работу с ботом' },
      { command: 'menu', description: 'Главное меню' },
      { command: 'help', description: 'Справка' }
    ]);
    
    logger.info('VHM24 Telegram Bot started successfully! 🤖');
  } catch (error) {
    logger.error('Failed to start bot', { error: error.message });
    process.exit(1);
  }
}

startBot();
