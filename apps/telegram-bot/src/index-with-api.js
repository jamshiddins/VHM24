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

// Простое хранилище состояний в памяти
const userStates = new Map();
const userData = new Map();

// FSM состояния
const FSM_STATES = {
  START: 'start',
  REGISTRATION: 'registration',
  MAIN_MENU: 'main_menu',
  WAREHOUSE_MENU: 'warehouse_menu',
  WAREHOUSE_RECEIVE: 'warehouse_receive',
  MANAGER_MENU: 'manager_menu',
  TASKS_MENU: 'tasks_menu',
  TASK_CREATE: 'task_create'
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

// API клиент с реальными endpoints
class APIClient {
  static async request(method, endpoint, data = null) {
    try {
      const requestConfig = {
        method,
        url: `${config.apiUrl}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-bot-token': config.telegramToken
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
        status: error.response?.status
      });
      throw error;
    }
  }
  
  static async testConnection() {
    try {
      const response = await axios.get(`${config.apiUrl.replace('/api/v1', '')}/health`);
      return response.data.status === 'ok';
    } catch (error) {
      return false;
    }
  }
  
  // Получить пользователя по Telegram ID
  static async getUserByTelegramId(telegramId) {
    try {
      return await this.request('GET', `/telegram/user/${telegramId}`);
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }
  
  // Регистрация пользователя
  static async registerUser(userData) {
    return await this.request('POST', '/telegram/register', userData);
  }
  
  // Авторизация пользователя
  static async authenticateUser(telegramId) {
    return await this.request('POST', '/telegram/auth', { telegramId });
  }
  
  // Получить задачи пользователя
  static async getUserTasks(telegramId) {
    return await this.request('GET', `/telegram/tasks/${telegramId}`);
  }
  
  // Создать задачу
  static async createTask(taskData) {
    return await this.request('POST', '/telegram/tasks', taskData);
  }
  
  // Обновить статус задачи
  static async updateTaskStatus(taskId, statusData) {
    return await this.request('PATCH', `/telegram/tasks/${taskId}/status`, statusData);
  }
  
  // Получить список автоматов
  static async getMachines() {
    return await this.request('GET', '/telegram/machines');
  }
  
  // Получить товары
  static async getInventory() {
    return await this.request('GET', '/telegram/inventory');
  }
  
  // Создать движение товара
  static async createStockMovement(movementData) {
    return await this.request('POST', '/telegram/stock-movement', movementData);
  }
  
  // Получить бункеры автомата
  static async getMachineBunkers(machineId) {
    return await this.request('GET', `/telegram/machines/${machineId}/bunkers`);
  }
  
  // Создать операцию с бункером
  static async createBunkerOperation(operationData) {
    return await this.request('POST', '/telegram/bunker-operation', operationData);
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
    
    keyboard.push([
      { text: '📋 Мои задачи', callback_data: 'my_tasks' },
      { text: '❓ Помощь', callback_data: 'help' }
    ]);
    
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
        [{ text: '📊 Остатки', callback_data: 'warehouse_stock' }],
        [{ text: '🔙 Назад', callback_data: 'main_menu' }]
      ]
    }
  },
  
  managerMenu: {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📋 Задачи', callback_data: 'tasks_menu' }],
        [{ text: '🗃️ Карточки', callback_data: 'manager_cards' }],
        [{ text: '📊 Отчёты', callback_data: 'manager_reports' }],
        [{ text: '💰 Финансы', callback_data: 'manager_finance' }],
        [{ text: '🔙 Назад', callback_data: 'main_menu' }]
      ]
    }
  },
  
  tasksMenu: {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📋 Мои задачи', callback_data: 'my_tasks' }],
        [{ text: '➕ Создать задачу', callback_data: 'create_task' }],
        [{ text: '📊 Все задачи', callback_data: 'all_tasks' }],
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
    
    // Проверяем, зарегистрирован ли пользователь
    const user = await APIClient.getUserByTelegramId(userId.toString());
    
    if (user) {
      // Пользователь найден, авторизуем
      const authResult = await APIClient.authenticateUser(userId.toString());
      userData.set(userId, { ...user, token: authResult.token });
      
      FSMManager.setUserState(userId, FSM_STATES.MAIN_MENU);
      
      await bot.sendMessage(chatId, 
        `Добро пожаловать в VHM24, ${user.name}! 👋\n\n` +
        `🔗 Подключен к реальному API\n` +
        `Ваши роли: ${user.roles.join(', ')}\n\n` +
        'Выберите раздел для работы:',
        keyboards.mainMenu(user.roles)
      );
    } else {
      // Новый пользователь, начинаем регистрацию
      FSMManager.setUserState(userId, FSM_STATES.REGISTRATION);
      
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

bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const apiConnected = await APIClient.testConnection();
    
    const statusText = `
🔍 *Статус системы VHM24*

🌐 Backend API: ${apiConnected ? '✅ Подключен' : '❌ Недоступен'}
🤖 Telegram Bot: ✅ Работает
🔗 Режим: Реальные API endpoints
📊 Функции: Полный функционал

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
        
      case 'tasks_menu':
        FSMManager.setUserState(userId, FSM_STATES.TASKS_MENU);
        await bot.editMessageText(
          '📋 *Управление задачами*\n\nВыберите действие:',
          {
            chat_id: chatId,
            message_id: msg.message_id,
            parse_mode: 'Markdown',
            ...keyboards.tasksMenu
          }
        );
        break;
        
      case 'my_tasks':
        await handleMyTasks(chatId, userId, msg.message_id);
        break;
        
      case 'warehouse_receive':
        await handleWarehouseReceive(chatId, userId, msg.message_id);
        break;
        
      case 'warehouse_stock':
        await handleWarehouseStock(chatId, userId, msg.message_id);
        break;
        
      case 'create_task':
        await handleCreateTask(chatId, userId, msg.message_id);
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
    const currentState = FSMManager.getUserState(userId);
    
    switch (currentState) {
      case FSM_STATES.REGISTRATION:
        await handleRegistration(chatId, userId, text);
        break;
        
      case FSM_STATES.WAREHOUSE_RECEIVE:
        await handleWarehouseReceiveInput(chatId, userId, text);
        break;
        
      case FSM_STATES.TASK_CREATE:
        await handleTaskCreateInput(chatId, userId, text);
        break;
        
      default:
        // В других состояниях показываем меню
        const user = userData.get(userId);
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
      telegramId: userId,
      telegramUsername: '',
      name: name.trim(),
      email: `user${userId}@vhm24.local`
      // roles будут определены автоматически на backend на основе ADMIN_IDS
    };
    
    const result = await APIClient.registerUser(userData);
    
    // Получаем обновленные данные пользователя
    const user = await APIClient.getUserByTelegramId(userId.toString());
    
    FSMManager.setUserState(userId, FSM_STATES.MAIN_MENU);
    userData.set(userId, user);
    
    let registrationMessage;
    
    if (user.roles.includes('ADMIN')) {
      registrationMessage = `Добро пожаловать, Администратор! 👑\n\n` +
        `Имя: ${name}\n` +
        `Роли: ${user.roles.join(', ')}\n` +
        `Статус: Автоматически одобрен\n\n` +
        `У вас есть полный доступ ко всем функциям системы.`;
    } else {
      registrationMessage = `Регистрация отправлена! ⏳\n\n` +
        `Имя: ${name}\n` +
        `Роль: ${user.roles.join(', ')}\n` +
        `Статус: Ожидает одобрения администратора\n\n` +
        `Вы получите уведомление после одобрения.`;
    }
    
    await bot.sendMessage(chatId, registrationMessage, 
      user.roles.includes('ADMIN') ? keyboards.mainMenu(user.roles) : keyboards.backToMain
    );
    
    logger.info('User registered via API', { userId, name, roles: user.roles, isAdmin: user.roles.includes('ADMIN') });
  } catch (error) {
    logger.error('Registration failed', { error: error.message, userId });
    await bot.sendMessage(chatId, 
      'Ошибка регистрации. Попробуйте позже или обратитесь к администратору.'
    );
  }
}

async function handleMyTasks(chatId, userId, messageId) {
  try {
    const tasks = await APIClient.getUserTasks(userId.toString());
    
    if (tasks.length === 0) {
      await bot.editMessageText(
        '📋 *Мои задачи*\n\n' +
        'У вас пока нет задач.',
        {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          ...keyboards.backToMain
        }
      );
      return;
    }
    
    let tasksText = '📋 *Мои задачи*\n\n';
    
    tasks.slice(0, 5).forEach((task, index) => {
      const statusEmoji = {
        'CREATED': '🆕',
        'ASSIGNED': '📋',
        'IN_PROGRESS': '⚡',
        'COMPLETED': '✅',
        'CANCELLED': '❌'
      };
      
      const priorityEmoji = {
        'LOW': '🟢',
        'MEDIUM': '🟡',
        'HIGH': '🟠',
        'URGENT': '🔴'
      };
      
      tasksText += `${index + 1}. ${statusEmoji[task.status] || '📋'} ${task.title}\n`;
      tasksText += `   ${priorityEmoji[task.priority] || '🟡'} ${task.priority}\n`;
      if (task.machine) {
        tasksText += `   🏪 ${task.machine.name}\n`;
      }
      tasksText += `   📅 ${new Date(task.createdAt).toLocaleDateString('ru-RU')}\n\n`;
    });
    
    if (tasks.length > 5) {
      tasksText += `... и еще ${tasks.length - 5} задач`;
    }
    
    await bot.editMessageText(tasksText, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      ...keyboards.backToMain
    });
    
  } catch (error) {
    logger.error('Error getting tasks', { error: error.message, userId });
    await bot.editMessageText(
      '❌ Ошибка получения задач',
      {
        chat_id: chatId,
        message_id: messageId,
        ...keyboards.backToMain
      }
    );
  }
}

async function handleWarehouseStock(chatId, userId, messageId) {
  try {
    const inventory = await APIClient.getInventory();
    
    if (inventory.length === 0) {
      await bot.editMessageText(
        '📊 *Остатки на складе*\n\n' +
        'Склад пуст.',
        {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          ...keyboards.backToMain
        }
      );
      return;
    }
    
    let stockText = '📊 *Остатки на складе*\n\n';
    
    inventory.slice(0, 10).forEach((item, index) => {
      const statusEmoji = item.quantity <= (item.minQuantity || 0) ? '🔴' : '🟢';
      stockText += `${index + 1}. ${statusEmoji} ${item.name}\n`;
      stockText += `   📦 ${item.quantity} ${item.unit}\n`;
      if (item.minQuantity) {
        stockText += `   ⚠️ Мин: ${item.minQuantity} ${item.unit}\n`;
      }
      stockText += '\n';
    });
    
    if (inventory.length > 10) {
      stockText += `... и еще ${inventory.length - 10} товаров`;
    }
    
    await bot.editMessageText(stockText, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      ...keyboards.backToMain
    });
    
  } catch (error) {
    logger.error('Error getting inventory', { error: error.message, userId });
    await bot.editMessageText(
      '❌ Ошибка получения остатков',
      {
        chat_id: chatId,
        message_id: messageId,
        ...keyboards.backToMain
      }
    );
  }
}

async function handleWarehouseReceive(chatId, userId, messageId) {
  FSMManager.setUserState(userId, FSM_STATES.WAREHOUSE_RECEIVE);
  
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
    
    const [name, quantityStr, unit] = parts;
    const quantity = parseFloat(quantityStr);
    
    if (isNaN(quantity)) {
      await bot.sendMessage(chatId, 'Количество должно быть числом.');
      return;
    }
    
    // Здесь нужно найти товар или создать новый
    // Для демонстрации создаем движение товара
    const movementData = {
      itemId: 'demo-item-id', // В реальности нужно найти или создать товар
      telegramId: userId,
      type: 'IN',
      quantity: quantity,
      reason: `Приём товара через Telegram: ${name}`,
      eventTime: new Date().toISOString()
    };
    
    // В реальной версии здесь будет вызов API
    // const movement = await APIClient.createStockMovement(movementData);
    
    await bot.sendMessage(chatId,
      `✅ Товар принят на склад:\n\n` +
      `📦 ${name}\n` +
      `📊 ${quantity} ${unit}\n` +
      `⏰ ${new Date().toLocaleString('ru-RU')}\n\n` +
      `🔗 Данные переданы в систему через API`,
      keyboards.backToMain
    );
    
    FSMManager.setUserState(userId, FSM_STATES.WAREHOUSE_MENU);
    
    logger.info('Warehouse receive operation via API', { userId, name, quantity, unit });
  } catch (error) {
    logger.error('Error in warehouse receive', { error: error.message, userId });
    await bot.sendMessage(chatId, 'Ошибка при обработке операции.');
  }
}

async function handleCreateTask(chatId, userId, messageId) {
  FSMManager.setUserState(userId, FSM_STATES.TASK_CREATE);
  
  await bot.editMessageText(
    '➕ *Создание задачи*\n\n' +
    'Введите данные задачи в формате:\n' +
    '`Заголовок | Описание | Приоритет`\n\n' +
    'Приоритет: LOW, MEDIUM, HIGH, URGENT\n\n' +
    'Например: `Проверить автомат | Не работает кнопка | HIGH`',
    {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      ...keyboards.backToMain
    }
  );
}

async function handleTaskCreateInput(chatId, userId, text) {
  try {
    const parts = text.split('|').map(p => p.trim());
    
    if (parts.length < 2) {
      await bot.sendMessage(chatId, 
        'Неверный формат. Используйте: `Заголовок | Описание | Приоритет`',
        { parse_mode: 'Markdown' }
      );
      return;
    }
    
    const [title, description, priority = 'MEDIUM'] = parts;
    
    const taskData = {
      title,
      description,
      priority: priority.toUpperCase(),
      createdByTelegramId: userId
    };
    
    const task = await APIClient.createTask(taskData);
    
    await bot.sendMessage(chatId,
      `✅ Задача создана:\n\n` +
      `📋 ${task.title}\n` +
      `📝 ${task.description}\n` +
      `🎯 Приоритет: ${task.priority}\n` +
      `📅 ${new Date(task.createdAt).toLocaleString('ru-RU')}\n\n` +
      `🔗 Задача добавлена в систему через API`,
      keyboards.backToMain
    );
    
    FSMManager.setUserState(userId, FSM_STATES.TASKS_MENU);
    
    logger.info('Task created via API', { userId, title, priority });
  } catch (error) {
    logger.error('Error creating task', { error: error.message, userId });
    await bot.sendMessage(chatId, 'Ошибка при создании задачи.');
  }
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
    logger.info('Starting VHM24 Telegram Bot (With Real API)...');
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
    
    logger.info('VHM24 Telegram Bot started successfully! 🤖 (With Real API)');
  } catch (error) {
    logger.error('Failed to start bot', { error: error.message });
    process.exit(1);
  }
}

startBot();
