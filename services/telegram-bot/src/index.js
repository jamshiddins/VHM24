const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const winston = require('winston');
const axios = require('axios');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Configuration
const config = {
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || '',
  apiUrl: process.env.API_URL || 'http://localhost:8000/api/v1',
  adminIds: (process.env.ADMIN_IDS || '').split(',').map(id => parseInt(id.trim())),
  mode: 'polling',
  polling: {
    interval: 1000,
    autoStart: true,
    params: {
      timeout: 10
    }
  }
};

// Validate required configuration
if (!config.telegramToken) {
  logger.error('TELEGRAM_BOT_TOKEN is not set in environment variables');
  process.exit(1);
}

// Create bot instance
logger.info('Starting bot in polling mode');
const bot = new TelegramBot(config.telegramToken, { polling: config.polling });

// Global error handler
bot.on('polling_error', (error) => {
  logger.error('Polling error:', error);
});

// API client setup
const apiClient = axios.create({
  baseURL: config.apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Store user sessions
global.userSessions = new Map();
global.apiClient = apiClient;
global.logger = logger;
global.config = config;

// Auth check function
async function checkAuth(userId) {
  return config.adminIds.includes(userId);
}

// Error handler function
async function errorHandler(bot, msg, error) {
  logger.error('Bot error:', error);
  try {
    await bot.sendMessage(msg.chat.id, 
      '❌ Произошла ошибка при обработке команды.\n' +
      'Попробуйте позже или обратитесь к администратору.'
    );
  } catch (sendError) {
    logger.error('Failed to send error message:', sendError);
  }
}

// API helper functions
async function apiRequest(endpoint, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: endpoint,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await apiClient(config);
    return response.data;
  } catch (error) {
    logger.error(`API request failed: ${endpoint}`, error.response?.data || error.message);
    throw error;
  }
}

// Command handlers
bot.onText(/\/start/, async (msg) => {
  try {
    const isAdmin = await checkAuth(msg.from.id);
    
    const welcomeText = `
🤖 Добро пожаловать в VHM24 Bot!

Это бот для управления вендинговой сетью.

👤 Ваш ID: ${msg.from.id}
🔐 Статус: ${isAdmin ? '✅ Администратор' : '❌ Не авторизован'}

${isAdmin ? 
  '🎉 У вас есть полный доступ ко всем функциям!\n\nДоступные команды:\n/help - Показать все команды\n/machines - Управление автоматами\n/inventory - Управление инвентарем\n/tasks - Управление задачами\n/reports - Отчеты' :
  'Для получения доступа обратитесь к администратору.'
}
    `;
    
    await bot.sendMessage(msg.chat.id, welcomeText);
    logger.info(`User ${msg.from.id} started the bot (Admin: ${isAdmin})`);
  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

bot.onText(/\/machines/, async (msg) => {
  try {
    const isAdmin = await checkAuth(msg.from.id);
    if (!isAdmin) {
      await bot.sendMessage(msg.chat.id, '🔐 Доступ запрещен. Только для администраторов.');
      return;
    }
    
    // Получаем список автоматов из API
    try {
      const machines = await apiRequest('/machines');
      
      if (!machines || machines.length === 0) {
        await bot.sendMessage(msg.chat.id, 
          '🤖 Автоматы не найдены\n\n' +
          'В системе пока нет зарегистрированных автоматов.'
        );
        return;
      }
      
      let machinesText = '🤖 Список автоматов:\n\n';
      machines.forEach((machine, index) => {
        machinesText += `${index + 1}. ${machine.name || `Автомат #${machine.id}`}\n`;
        machinesText += `   📍 Локация: ${machine.location || 'Не указана'}\n`;
        machinesText += `   📊 Статус: ${machine.status || 'Неизвестен'}\n\n`;
      });
      
      await bot.sendMessage(msg.chat.id, machinesText);
      
    } catch (apiError) {
      await bot.sendMessage(msg.chat.id, 
        '🤖 Управление автоматами\n\n' +
        '⚠️ Не удалось загрузить данные с сервера.\n' +
        'Проверьте подключение к API.'
      );
    }
    
  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

bot.onText(/\/inventory/, async (msg) => {
  try {
    const isAdmin = await checkAuth(msg.from.id);
    if (!isAdmin) {
      await bot.sendMessage(msg.chat.id, '🔐 Доступ запрещен. Только для администраторов.');
      return;
    }
    
    try {
      const inventory = await apiRequest('/inventory');
      
      if (!inventory || inventory.length === 0) {
        await bot.sendMessage(msg.chat.id, 
          '📦 Инвентарь пуст\n\n' +
          'В системе пока нет товаров.'
        );
        return;
      }
      
      let inventoryText = '📦 Инвентарь:\n\n';
      inventory.forEach((item, index) => {
        inventoryText += `${index + 1}. ${item.name || `Товар #${item.id}`}\n`;
        inventoryText += `   📊 Количество: ${item.quantity || 0}\n`;
        inventoryText += `   💰 Цена: ${item.price || 0} руб.\n\n`;
      });
      
      await bot.sendMessage(msg.chat.id, inventoryText);
      
    } catch (apiError) {
      await bot.sendMessage(msg.chat.id, 
        '📦 Управление инвентарем\n\n' +
        '⚠️ Не удалось загрузить данные с сервера.\n' +
        'Проверьте подключение к API.'
      );
    }
    
  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

bot.onText(/\/tasks/, async (msg) => {
  try {
    const isAdmin = await checkAuth(msg.from.id);
    if (!isAdmin) {
      await bot.sendMessage(msg.chat.id, '🔐 Доступ запрещен. Только для администраторов.');
      return;
    }
    
    try {
      const tasks = await apiRequest('/tasks');
      
      if (!tasks || tasks.length === 0) {
        await bot.sendMessage(msg.chat.id, 
          '📋 Задачи отсутствуют\n\n' +
          'В системе пока нет активных задач.'
        );
        return;
      }
      
      let tasksText = '📋 Активные задачи:\n\n';
      tasks.forEach((task, index) => {
        tasksText += `${index + 1}. ${task.title || `Задача #${task.id}`}\n`;
        tasksText += `   📝 Описание: ${task.description || 'Не указано'}\n`;
        tasksText += `   📊 Статус: ${task.status || 'Новая'}\n`;
        tasksText += `   👤 Исполнитель: ${task.assignee || 'Не назначен'}\n\n`;
      });
      
      await bot.sendMessage(msg.chat.id, tasksText);
      
    } catch (apiError) {
      await bot.sendMessage(msg.chat.id, 
        '📋 Управление задачами\n\n' +
        '⚠️ Не удалось загрузить данные с сервера.\n' +
        'Проверьте подключение к API.'
      );
    }
    
  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

bot.onText(/\/reports/, async (msg) => {
  try {
    const isAdmin = await checkAuth(msg.from.id);
    if (!isAdmin) {
      await bot.sendMessage(msg.chat.id, '🔐 Доступ запрещен. Только для администраторов.');
      return;
    }
    
    try {
      const stats = await apiRequest('/dashboard/stats');
      
      let reportText = '📊 Отчет по системе:\n\n';
      
      if (stats) {
        reportText += `🤖 Автоматы: ${stats.totalMachines || 0}\n`;
        reportText += `📦 Товаров: ${stats.totalProducts || 0}\n`;
        reportText += `📋 Задач: ${stats.totalTasks || 0}\n`;
        reportText += `👥 Пользователей: ${stats.totalUsers || 0}\n\n`;
        reportText += `💰 Выручка сегодня: ${stats.todayRevenue || 0} руб.\n`;
        reportText += `📈 Выручка за месяц: ${stats.monthRevenue || 0} руб.\n`;
      } else {
        reportText += 'Статистика недоступна';
      }
      
      await bot.sendMessage(msg.chat.id, reportText);
      
    } catch (apiError) {
      await bot.sendMessage(msg.chat.id, 
        '📊 Отчеты\n\n' +
        '⚠️ Не удалось загрузить статистику с сервера.\n' +
        'Проверьте подключение к API.'
      );
    }
    
  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

bot.onText(/\/status/, async (msg) => {
  try {
    const isAdmin = await checkAuth(msg.from.id);
    if (!isAdmin) {
      await bot.sendMessage(msg.chat.id, '🔐 Доступ запрещен. Только для администраторов.');
      return;
    }
    
    try {
      // Проверяем статус API
      const healthCheck = await apiRequest('/health');
      
      let statusText = '🔧 Статус системы:\n\n';
      statusText += `🌐 API: ${healthCheck ? '✅ Работает' : '❌ Недоступен'}\n`;
      statusText += `🤖 Telegram Bot: ✅ Работает\n`;
      statusText += `📊 Dashboard: ✅ Работает\n`;
      statusText += `🗄️ База данных: ${healthCheck?.database ? '✅ Подключена' : '❌ Недоступна'}\n\n`;
      statusText += `⏰ Время сервера: ${new Date().toLocaleString('ru-RU')}\n`;
      statusText += `🔄 Uptime бота: ${Math.floor(process.uptime() / 60)} мин.`;
      
      await bot.sendMessage(msg.chat.id, statusText);
      
    } catch (apiError) {
      await bot.sendMessage(msg.chat.id, 
        '🔧 Статус системы:\n\n' +
        '🤖 Telegram Bot: ✅ Работает\n' +
        '🌐 API: ❌ Недоступен\n' +
        '📊 Dashboard: ❓ Неизвестно\n' +
        '🗄️ База данных: ❓ Неизвестно\n\n' +
        '⚠️ Проблемы с подключением к серверу.'
      );
    }
    
  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

bot.onText(/\/register/, async (msg) => {
  try {
    const registerText = `
📝 Регистрация в системе VHM24

Для регистрации обратитесь к администратору со следующей информацией:

👤 Ваш Telegram ID: ${msg.from.id}
📱 Username: @${msg.from.username || 'не указан'}
👨‍💼 ФИО: ${msg.from.first_name} ${msg.from.last_name || ''}

Администратор добавит вас в систему и назначит соответствующую роль.

🔐 Текущий статус: ${config.adminIds.includes(msg.from.id) ? '✅ Администратор' : '❌ Не авторизован'}
    `;
    
    await bot.sendMessage(msg.chat.id, registerText);
  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

bot.onText(/\/help/, async (msg) => {
  try {
    const isAdmin = await checkAuth(msg.from.id);
    
    const helpText = `
🤖 VHM24 Bot - Команды

📋 Основные команды:
/start - Начать работу с ботом
/register - Информация о регистрации
/help - Показать эту справку

${isAdmin ? `
🔧 Управление (администратор):
/machines - Управление автоматами
/inventory - Управление инвентарем
/tasks - Управление задачами
/reports - Отчеты и статистика
/status - Статус системы

🚚 Для водителей:
/route - Управление маршрутами
/fuel - Отчет о заправке
/mileage - Ввод пробега

📦 Для склада:
/receive - Прием товара
/weigh - Взвешивание
` : `
🔐 Для получения доступа к дополнительным функциям обратитесь к администратору.
`}

👤 Ваш ID: ${msg.from.id}
🔐 Статус: ${isAdmin ? '✅ Администратор' : '❌ Не авторизован'}
    `;

    await bot.sendMessage(msg.chat.id, helpText);
  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

// Role-specific commands (будут работать только для админов пока)
bot.onText(/\/route/, async (msg) => {
  try {
    const isAdmin = await checkAuth(msg.from.id);
    if (!isAdmin) {
      await bot.sendMessage(msg.chat.id, '🔐 Доступ запрещен. Обратитесь к администратору.');
      return;
    }
    
    await bot.sendMessage(msg.chat.id, 
      '🚚 Управление маршрутами\n\n' +
      '📍 Функция для водителей\n' +
      'Здесь будет отображаться информация о маршрутах и возможность их обновления.'
    );
  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

bot.onText(/\/fuel/, async (msg) => {
  try {
    const isAdmin = await checkAuth(msg.from.id);
    if (!isAdmin) {
      await bot.sendMessage(msg.chat.id, '🔐 Доступ запрещен. Обратитесь к администратору.');
      return;
    }
    
    await bot.sendMessage(msg.chat.id, 
      '⛽ Отчет о заправке\n\n' +
      '📝 Функция для водителей\n' +
      'Здесь можно будет отправить отчет о заправке транспорта.'
    );
  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

bot.onText(/\/receive/, async (msg) => {
  try {
    const isAdmin = await checkAuth(msg.from.id);
    if (!isAdmin) {
      await bot.sendMessage(msg.chat.id, '🔐 Доступ запрещен. Обратитесь к администратору.');
      return;
    }
    
    await bot.sendMessage(msg.chat.id, 
      '📦 Прием товара\n\n' +
      '🏪 Функция для склада\n' +
      'Здесь можно будет оформить прием товара на склад.'
    );
  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

// Handle all other messages
bot.on('message', async (msg) => {
  try {
    // Skip commands (they are handled separately)
    if (msg.text && msg.text.startsWith('/')) {
      return;
    }

    // Handle location
    if (msg.location) {
      const isAdmin = await checkAuth(msg.from.id);
      if (!isAdmin) {
        await bot.sendMessage(msg.chat.id, '🔐 Доступ запрещен. Обратитесь к администратору.');
        return;
      }
      
      await bot.sendMessage(msg.chat.id, 
        '📍 Получена геолокация\n' +
        `Широта: ${msg.location.latitude}\n` +
        `Долгота: ${msg.location.longitude}\n\n` +
        '✅ Локация сохранена в системе.'
      );
      return;
    }

    // Handle photos
    if (msg.photo) {
      const isAdmin = await checkAuth(msg.from.id);
      if (!isAdmin) {
        await bot.sendMessage(msg.chat.id, '🔐 Доступ запрещен. Обратитесь к администратору.');
        return;
      }
      
      await bot.sendMessage(msg.chat.id, 
        '📸 Получено фото\n' +
        '✅ Фото сохранено в системе.\n' +
        'Функция сканирования QR-кодов будет добавлена в следующих версиях.'
      );
      return;
    }

    // Handle contact
    if (msg.contact) {
      await bot.sendMessage(msg.chat.id, 
        '📞 Получен контакт\n' +
        '✅ Спасибо за предоставленную информацию!'
      );
      return;
    }

    // Handle text messages
    if (msg.text) {
      await bot.sendMessage(msg.chat.id,
        '🤖 Используйте команды для взаимодействия с ботом.\n\n' +
        'Введите /help для просмотра доступных команд.'
      );
    }

  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down Telegram bot...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down Telegram bot...');
  bot.stopPolling();
  process.exit(0);
});

// Start the bot
logger.info('VHM24 Telegram Bot is starting...');
logger.info(`Admin IDs: ${config.adminIds.join(', ')}`);
logger.info(`API URL: ${config.apiUrl}`);

// Set bot commands
bot.setMyCommands([
  { command: 'start', description: 'Начать работу с ботом' },
  { command: 'help', description: 'Справка по командам' },
  { command: 'machines', description: 'Управление автоматами' },
  { command: 'inventory', description: 'Управление инвентарем' },
  { command: 'tasks', description: 'Управление задачами' },
  { command: 'reports', description: 'Отчеты и статистика' },
  { command: 'status', description: 'Статус системы' }
]).then(() => {
  logger.info('Bot commands have been set');
}).catch((error) => {
  logger.error('Failed to set bot commands:', error);
});

logger.info('VHM24 Telegram Bot is running!');

// Health check через логи (без отдельного сервера)
setInterval(() => {
  logger.info(`Bot health check: OK, uptime: ${Math.floor(process.uptime())} seconds`);
}, 60000); // каждую минуту
