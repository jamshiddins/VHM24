require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
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
  apiUrl: process.env.API_URL || 'http://localhost:8000/api/v1',
  adminIds: process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',') : []
};

// Инициализация бота
const bot = new TelegramBot(config.telegramToken, { polling: true });

// Простое хранилище состояний в памяти (для тестирования без Redis)
const userStates = new Map();
const userData = new Map();

// FSM состояния
const FSM_STATES = {
  START: 'start',
  REGISTRATION: 'registration',
  MAIN_MENU: 'main_menu',
  WAREHOUSE_MENU: 'warehouse_menu',
  MANAGER_MENU: 'manager_menu'
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

// Утилиты для работы с FSM (без Redis)
class FSMManager {
  static getUserState(userId) {
    return userStates.get(userId) || FSM_STATES.START;
  }
  
  static setUserState(userId, state, data = {}) {
    userStates.set(userId, state);
    if (Object.keys(data).length > 0) {
      userData.set(userId, { ...userData.get(userId), ...data });
    }
  }
  
  static getUserData(userId) {
    return userData.get(userId) || {};
  }
  
  static clearUserData(userId) {
    userData.delete(userId);
  }
}

// API клиент
class APIClient {
  static async request(method, endpoint, data = null, userId = null) {
    try {
      const requestConfig = {
        method,
        url: `${config.apiUrl}${endpoint}`,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (data) {
        requestConfig.data = data;
      }
      
      const response = await axios(requestConfig);
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
  
  static async testConnection() {
    try {
      // Проверяем основной health endpoint
      const response = await axios.get(`${config.apiUrl.replace('/api/v1', '')}/health`);
      return response.data.status === 'ok';
    } catch (error) {
      return false;
    }
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
    
    // Проверяем подключение к API
    const apiConnected = await APIClient.testConnection();
    
    if (!apiConnected) {
      await bot.sendMessage(chatId, 
        '⚠️ Сервер временно недоступен. Попробуйте позже.\n\n' +
        'Если проблема повторяется, обратитесь к администратору.'
      );
      return;
    }
    
    // Для демонстрации создаем тестового пользователя
    const testUser = {
      id: userId.toString(),
      name: msg.from.first_name || 'Пользователь',
      roles: [USER_ROLES.OPERATOR, USER_ROLES.WAREHOUSE] // Даем несколько ролей для тестирования
    };
    
    FSMManager.setUserState(userId, FSM_STATES.MAIN_MENU);
    userData.set(userId, testUser);
    
    await bot.sendMessage(chatId, 
      `Добро пожаловать в VHM24, ${testUser.name}! 👋\n\n` +
      `🎯 Режим тестирования (без Redis)\n` +
      `Ваши роли: ${testUser.roles.join(', ')}\n\n` +
      'Выберите раздел для работы:',
      keyboards.mainMenu(testUser.roles)
    );
    
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
/status - Статус системы

*Роли и функции:*

📦 *Склад:*
• Приём товаров
• Управление бункерами
• Инвентаризация

📊 *Менеджер:*
• Карточки товаров
• Отчёты
• Управление задачами

🎮 *Оператор:*
• Операции с автоматами
• Мониторинг состояния

⚠️ *Режим тестирования*
Бот работает без Redis для демонстрации функций.

*Поддержка:* @vhm24_support
  `;
  
  await bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
});

bot.onText(/\/menu/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  try {
    const user = userData.get(userId);
    if (user) {
      FSMManager.setUserState(userId, FSM_STATES.MAIN_MENU);
      await bot.sendMessage(chatId, 
        'Главное меню:',
        keyboards.mainMenu(user.roles)
      );
    } else {
      await bot.sendMessage(chatId, 'Сначала запустите бота командой /start');
    }
  } catch (error) {
    logger.error('Error in /menu command', { error: error.message, userId });
    await bot.sendMessage(chatId, 'Произошла ошибка. Попробуйте позже.');
  }
});

bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const apiConnected = await APIClient.testConnection();
    
    const statusText = `
🔍 *Статус системы VHM24*

🌐 Backend API: ${apiConnected ? '✅ Подключен' : '❌ Недоступен'}
🤖 Telegram Bot: ✅ Работает
🔴 Redis: ⚠️ Отключен (тестовый режим)
📊 Режим: Тестирование без Redis

⏰ Время: ${new Date().toLocaleString('ru-RU')}
    `;
    
    await bot.sendMessage(chatId, statusText, { parse_mode: 'Markdown' });
  } catch (error) {
    await bot.sendMessage(chatId, 'Ошибка получения статуса системы.');
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
    
    const user = userData.get(userId);
    if (!user) {
      await bot.sendMessage(chatId, 'Сначала запустите бота командой /start');
      return;
    }
    
    switch (data) {
      case 'main_menu':
        FSMManager.setUserState(userId, FSM_STATES.MAIN_MENU);
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
        FSMManager.setUserState(userId, FSM_STATES.WAREHOUSE_MENU);
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
        FSMManager.setUserState(userId, FSM_STATES.MANAGER_MENU);
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

// Обработчики для конкретных функций
async function handleWarehouseReceive(chatId, userId, messageId) {
  await bot.editMessageText(
    '📥 *Приём товаров*\n\n' +
    '🎯 Демонстрационный режим\n\n' +
    'В полной версии здесь будет:\n' +
    '• Сканирование QR-кодов\n' +
    '• Ввод данных о товарах\n' +
    '• Фото-фиксация\n' +
    '• Автоматическое обновление остатков',
    {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      ...keyboards.backToMain
    }
  );
}

async function handleWarehouseBunkers(chatId, userId, messageId) {
  await bot.editMessageText(
    '🗂️ *Управление бункерами*\n\n' +
    '🎯 Демонстрационный режим\n\n' +
    'В полной версии здесь будет:\n' +
    '• Просмотр состояния бункеров\n' +
    '• Заполнение бункеров\n' +
    '• Мойка и обслуживание\n' +
    '• Фото-фиксация состояния',
    {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      ...keyboards.backToMain
    }
  );
}

async function handleWarehouseInventory(chatId, userId, messageId) {
  await bot.editMessageText(
    '📋 *Инвентаризация*\n\n' +
    '🎯 Демонстрационный режим\n\n' +
    'В полной версии здесь будет:\n' +
    '• Сканирование QR-кодов\n' +
    '• Подсчёт остатков\n' +
    '• Фото-фиксация\n' +
    '• Автоматическое формирование отчётов',
    {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      ...keyboards.backToMain
    }
  );
}

// Обработка ошибок
bot.on('polling_error', (error) => {
  logger.error('Polling error', { error: error.message });
});

process.on('SIGINT', async () => {
  logger.info('Bot shutting down...');
  await bot.stopPolling();
  process.exit(0);
});

// Запуск бота
async function startBot() {
  try {
    logger.info('Starting VHM24 Telegram Bot (No Redis Mode)...');
    logger.info(`Bot token: ${config.telegramToken ? 'Set' : 'Not set'}`);
    logger.info(`API URL: ${config.apiUrl}`);
    
    // Проверяем подключение к API
    const apiConnected = await APIClient.testConnection();
    logger.info(`API connection: ${apiConnected ? 'Connected' : 'Failed'}`);
    
    // Устанавливаем команды бота
    await bot.setMyCommands([
      { command: 'start', description: 'Начать работу с ботом' },
      { command: 'menu', description: 'Главное меню' },
      { command: 'help', description: 'Справка' },
      { command: 'status', description: 'Статус системы' }
    ]);
    
    logger.info('VHM24 Telegram Bot started successfully! 🤖 (No Redis Mode)');
  } catch (error) {
    logger.error('Failed to start bot', { error: error.message });
    process.exit(1);
  }
}

startBot();
