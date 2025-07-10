const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const winston = require('winston');
const axios = require('axios');
const path = require('path');

// Handlers
const { handleStart } = require('./handlers/startHandler.js');
const { handleMachines } = require('./handlers/machinesHandler.js');
const { handleInventory } = require('./handlers/inventoryHandler.js');
const { handleTasks } = require('./handlers/tasksHandler.js');
const { handleReports } = require('./handlers/reportsHandler.js');
const { handleSettings } = require('./handlers/settingsHandler.js');
const { handleCallbackQuery } = require('./handlers/callbackHandler.js');
const UploadHandler = require('./handlers/uploadHandler.js');

// FSM Handlers
const registrationHandler = require('./handlers/registrationHandler.js');
const driverHandler = require('./handlers/driverHandler.js');
const warehouseHandler = require('./handlers/warehouseHandler.js');
const operatorHandler = require('./handlers/operatorHandler.js');
const { TechnicianHandler } = require('./handlers/technicianHandler.js');

// FSM
const fsmManager = require('./fsm/manager.js');
const { 
  REGISTRATION_STATES, 
  DRIVER_STATES, 
  WAREHOUSE_STATES, 
  OPERATOR_STATES,
  TECHNICIAN_STATES,
  isRegistrationState, 
  isDriverState, 
  isWarehouseState, 
  isOperatorState,
  isTechnicianState 
} = require('./fsm/states.js');

// Utils
const { checkAuth } = require('./utils/auth.js');
const { errorHandler } = require('./utils/errorHandler.js');

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
    }),
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/combined.log') 
    })
  ]
});

// Configuration
const config = {
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || '',
  apiUrl: process.env.API_URL || 'http://localhost:8000/api/v1',
  adminIds: (process.env.ADMIN_IDS || '').split(',').map(id => id.trim()),
  // Определяем режим работы бота (polling или webhook)
  mode: process.env.NODE_ENV === 'production' ? 'webhook' : 'polling',
  polling: {
    interval: 1000,
    autoStart: true,
    params: {
      timeout: 10
    }
  },
  webhook: {
    port: process.env.TELEGRAM_WEBHOOK_PORT || 8443,
    url: process.env.TELEGRAM_WEBHOOK_URL || ''
  }
};

// Validate required configuration
if (!config.telegramToken) {
  logger.error('TELEGRAM_BOT_TOKEN is not set in environment variables');
  process.exit(1);
}

// Create bot instance
let bot;
if (config.mode === 'webhook' && config.webhook.url) {
  logger.info(`Starting bot in webhook mode with URL: ${config.webhook.url}`);
  bot = new TelegramBot(config.telegramToken, {
    webhook: {
      port: config.webhook.port,
      host: '0.0.0.0'
    }
  });
  // Устанавливаем webhook
  bot.setWebHook(config.webhook.url)
    .then(() => logger.info('Webhook set successfully'))
    .catch(error => logger.error('Failed to set webhook:', error));
} else {
  logger.info('Starting bot in polling mode');
  bot = new TelegramBot(config.telegramToken, { polling: config.polling });
}

// Global error handler
bot.on('polling_error', (error) => {
  logger.error('Polling error:', error);
});

bot.on('webhook_error', (error) => {
  logger.error('Webhook error:', error);
});

// API client setup
const apiClient = axios.create({
  baseURL: config.apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
apiClient.interceptors.request.use((config) => {
  const token = global.userTokens?.get(global.currentUserId);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    logger.error('API Error:', error.response?.data || error.message);
    throw error;
  }
);

// Store user tokens (in production, use Redis or similar)
global.userTokens = new Map();
global.apiClient = apiClient;
global.logger = logger;
global.config = config;

// Initialize handlers
let technicianHandler;
let uploadHandler;

// Initialize FSM Manager
(async () => {
  try {
    await fsmManager.initRedis();
    logger.info('FSM Manager initialized');
    
    // Initialize TechnicianHandler after bot is ready
    // Note: prisma will be initialized when needed
    technicianHandler = new TechnicianHandler(bot, null);
    logger.info('TechnicianHandler initialized');
    
    // Initialize UploadHandler for DigitalOcean Spaces integration
    uploadHandler = new UploadHandler(bot);
    logger.info('UploadHandler initialized - DigitalOcean Spaces ready');
    
    // Setup cleanup interval for temporary files
    setInterval(() => {
      if (uploadHandler) {
        uploadHandler.cleanupTempFiles();
      }
    }, 60 * 60 * 1000); // Cleanup every hour
    
  } catch (error) {
    logger.error('FSM Manager initialization failed:', error);
  }
})();

// Command handlers
bot.onText(/\/start/, async (msg) => {
  try {
    await handleStart(bot, msg);
  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

bot.onText(/\/machines/, async (msg) => {
  try {
    if (!await checkAuth(bot, msg)) return;
    await handleMachines(bot, msg);
  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

bot.onText(/\/inventory/, async (msg) => {
  try {
    if (!await checkAuth(bot, msg)) return;
    await handleInventory(bot, msg);
  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

bot.onText(/\/tasks/, async (msg) => {
  try {
    if (!await checkAuth(bot, msg)) return;
    await handleTasks(bot, msg);
  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

bot.onText(/\/reports/, async (msg) => {
  try {
    if (!await checkAuth(bot, msg)) return;
    await handleReports(bot, msg);
  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

bot.onText(/\/settings/, async (msg) => {
  try {
    if (!await checkAuth(bot, msg)) return;
    await handleSettings(bot, msg);
  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

// Недостающие команды для полной функциональности
bot.onText(/\/set_password/, async (msg) => {
  try {
    if (!await checkAuth(bot, msg)) return;
    await bot.sendMessage(msg.chat.id, 
      '🔐 Смена пароля временно недоступна.\n' +
      'Обратитесь к администратору для смены пароля.'
    );
  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

bot.onText(/\/change_password/, async (msg) => {
  try {
    if (!await checkAuth(bot, msg)) return;
    await bot.sendMessage(msg.chat.id, 
      '🔐 Изменение пароля временно недоступно.\n' +
      'Обратитесь к администратору для изменения пароля.'
    );
  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

bot.onText(/\/route/, async (msg) => {
  try {
    if (!await checkAuth(bot, msg)) return;
    await bot.sendMessage(msg.chat.id, 
      '🚚 Управление маршрутами.\n' +
      'Используйте меню водителя для работы с маршрутами.'
    );
  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

bot.onText(/\/fuel/, async (msg) => {
  try {
    if (!await checkAuth(bot, msg)) return;
    await bot.sendMessage(msg.chat.id, 
      '⛽ Заправка.\n' +
      'Используйте меню водителя для отчёта о заправке.'
    );
  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

bot.onText(/\/mileage/, async (msg) => {
  try {
    if (!await checkAuth(bot, msg)) return;
    await bot.sendMessage(msg.chat.id, 
      '📏 Пробег.\n' +
      'Используйте меню водителя для ввода пробега.'
    );
  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

bot.onText(/\/arrived/, async (msg) => {
  try {
    if (!await checkAuth(bot, msg)) return;
    await bot.sendMessage(msg.chat.id, 
      '📍 Прибытие.\n' +
      'Используйте меню водителя для подтверждения прибытия.'
    );
  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

bot.onText(/\/receive/, async (msg) => {
  try {
    if (!await checkAuth(bot, msg)) return;
    await bot.sendMessage(msg.chat.id, 
      '📦 Приём товара.\n' +
      'Используйте меню склада для приёма товаров.'
    );
  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

bot.onText(/\/weigh/, async (msg) => {
  try {
    if (!await checkAuth(bot, msg)) return;
    await bot.sendMessage(msg.chat.id, 
      '⚖️ Взвешивание.\n' +
      'Используйте меню склада для взвешивания товаров.'
    );
  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

bot.onText(/\/fill_bunker/, async (msg) => {
  try {
    if (!await checkAuth(bot, msg)) return;
    await bot.sendMessage(msg.chat.id, 
      '🗂️ Заполнение бункера.\n' +
      'Используйте меню склада для заполнения бункеров.'
    );
  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

bot.onText(/\/select_machine/, async (msg) => {
  try {
    if (!await checkAuth(bot, msg)) return;
    await bot.sendMessage(msg.chat.id, 
      '🤖 Выбор автомата.\n' +
      'Используйте меню оператора для выбора автомата.'
    );
  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

bot.onText(/\/set_remains/, async (msg) => {
  try {
    if (!await checkAuth(bot, msg)) return;
    await bot.sendMessage(msg.chat.id, 
      '📊 Остатки.\n' +
      'Используйте меню оператора для установки остатков.'
    );
  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

bot.onText(/\/report_problem/, async (msg) => {
  try {
    if (!await checkAuth(bot, msg)) return;
    await bot.sendMessage(msg.chat.id, 
      '🚨 Сообщить о проблеме.\n' +
      'Используйте соответствующее меню для сообщения о проблемах.'
    );
  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

bot.onText(/\/help/, async (msg) => {
  const helpText = `
🤖 VHM24 Bot Commands

/start - Start the bot and authenticate
/machines - View and manage vending machines
/inventory - Manage inventory items
/tasks - View and manage tasks
/reports - Generate reports
/settings - Bot settings and preferences
/help - Show this help message

Role-specific commands:
/route - Manage routes (drivers)
/fuel - Report fuel (drivers)
/mileage - Enter mileage (drivers)
/arrived - Confirm arrival (drivers)
/receive - Receive goods (warehouse)
/weigh - Weigh items (warehouse)
/fill_bunker - Fill bunkers (warehouse)
/select_machine - Select machine (operators)
/set_remains - Set remains (operators)
/report_problem - Report problems (all)

Quick Actions:
• Send machine ID to view details
• Send QR code photo to access machine
• Send location to find nearest machines

For support, contact @vhm24_support
  `;

  await bot.sendMessage(msg.chat.id, helpText);
});

// Callback query handler
bot.on('callback_query', async (callbackQuery) => {
  try {
    await handleCallbackQuery(bot, callbackQuery);
  } catch (error) {
    logger.error('Callback query error:', error);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '❌ Error processing request',
      show_alert: true
    });
  }
});

// FSM Message Handler - обрабатывает все сообщения через FSM
bot.on('message', async (msg) => {
  try {
    const userId = msg.from.id;
    const currentState = await fsmManager.getUserState(userId);
    
    // Пропускаем команды (они обрабатываются отдельно)
    if (msg.text && msg.text.startsWith('/')) {
      return;
    }

    // Обработка контактов (номер телефона)
    if (msg.contact) {
      if (isRegistrationState(currentState)) {
        const handled = await registrationHandler.handlePhoneNumber(bot, msg);
        if (handled) return;
      }
    }

    // Обработка локации
    if (msg.location) {
      // FSM обработка GPS для водителей
      if (isDriverState(currentState)) {
        const handled = await driverHandler.handleGPSLocation(bot, msg);
        if (handled) return;
      }
      
      // Обычная обработка локации для поиска машин
      if (!await checkAuth(bot, msg)) return;
      
      const { latitude, longitude } = msg.location;
      
      // Find nearest machines
      const response = await global.apiClient.get('/machines', {
        params: {
          lat: latitude,
          lon: longitude,
          radius: 5000 // 5km radius
        }
      });

      if (response.data.data.length === 0) {
        await bot.sendMessage(msg.chat.id, '📍 No machines found nearby');
        return;
      }

      const machines = response.data.data.slice(0, 5); // Show top 5 nearest
      let message = '📍 Nearest Machines:\n\n';
      
      machines.forEach((machine, index) => {
        const distance = machine.distance ? `${(machine.distance / 1000).toFixed(1)}km` : 'N/A';
        message += `${index + 1}. ${machine.name}\n`;
        message += `   📍 ${machine.location || 'No address'}\n`;
        message += `   📏 Distance: ${distance}\n`;
        message += `   🔧 Status: ${machine.status}\n\n`;
      });

      await bot.sendMessage(msg.chat.id, message);
      return;
    }

    // Обработка фото
    if (msg.photo) {
      // FSM обработка фото для водителей
      if (isDriverState(currentState)) {
        const handled = await driverHandler.handleFuelPhoto(bot, msg);
        if (handled) return;
      }

      // FSM обработка фото для склада
      if (isWarehouseState(currentState)) {
        const handled = await warehouseHandler.handleConfirmationPhoto(bot, msg);
        if (handled) return;
      }

      // FSM обработка фото для операторов
      if (isOperatorState(currentState)) {
        const handled = await operatorHandler.handleBunkerPhoto(bot, msg);
        if (handled) return;
      }
      
      // Обычная обработка фото
      if (!await checkAuth(bot, msg)) return;
      
      await bot.sendMessage(msg.chat.id, 
        '📸 QR code scanning is under development.\n' +
        'Please use /machines command to access machines.'
      );
      return;
    }

    // Обработка текстовых сообщений
    if (msg.text) {
      // FSM обработка текста для регистрации
      if (isRegistrationState(currentState)) {
        const handled = await registrationHandler.handlePassword(bot, msg);
        if (handled) return;
      }

      // FSM обработка текста для водителей
      if (isDriverState(currentState)) {
        const handled = await driverHandler.handleMileage(bot, msg);
        if (handled) return;
      }

      // FSM обработка текста для склада
      if (isWarehouseState(currentState)) {
        let handled = await warehouseHandler.handleItemScan(bot, msg);
        if (handled) return;
        
        handled = await warehouseHandler.handleQuantityInput(bot, msg);
        if (handled) return;
        
        handled = await warehouseHandler.handleWeightInput(bot, msg);
        if (handled) return;
      }

      // FSM обработка текста для операторов
      if (isOperatorState(currentState)) {
        let handled = await operatorHandler.handleRemainsInput(bot, msg);
        if (handled) return;
        
        handled = await operatorHandler.handleProblemDescription(bot, msg);
        if (handled) return;
      }

      // FSM обработка текста для техников
      if (isTechnicianState(currentState)) {
        if (technicianHandler) {
          if (currentState === TECHNICIAN_STATES.TECHNICIAN_PART_REPLACEMENT) {
            await technicianHandler.handlePartReplacementInput(msg.chat.id, userId, msg.text);
            return;
          }
          
          if (currentState === TECHNICIAN_STATES.TECHNICIAN_REPORT_PROBLEM) {
            await technicianHandler.handleProblemReport(msg.chat.id, userId, msg.text);
            return;
          }
        }
      }

      // Если сообщение не обработано FSM и пользователь авторизован
      if (await checkAuth(bot, msg)) {
        await bot.sendMessage(msg.chat.id,
          '🤖 Используйте команды или кнопки меню для взаимодействия с ботом.\n\n' +
          'Введите /help для просмотра доступных команд.'
        );
      }
    }

  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down Telegram bot...');
  if (config.mode === 'polling') {
    bot.stopPolling();
  } else if (config.mode === 'webhook') {
    bot.deleteWebHook();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down Telegram bot...');
  if (config.mode === 'polling') {
    bot.stopPolling();
  } else if (config.mode === 'webhook') {
    bot.deleteWebHook();
  }
  process.exit(0);
});

// Start the bot
logger.info('VHM24 Telegram Bot is starting...');
logger.info(`Admin IDs: ${config.adminIds.join(', ')}`);
logger.info(`API URL: ${config.apiUrl}`);

// Set bot commands
bot.setMyCommands([
  { command: 'start', description: 'Start the bot' },
  { command: 'machines', description: 'View machines' },
  { command: 'inventory', description: 'Manage inventory' },
  { command: 'tasks', description: 'View tasks' },
  { command: 'reports', description: 'Generate reports' },
  { command: 'settings', description: 'Bot settings' },
  { command: 'help', description: 'Show help' }
]).then(() => {
  logger.info('Bot commands have been set');
}).catch((error) => {
  logger.error('Failed to set bot commands:', error);
});

logger.info('VHM24 Telegram Bot is running!');


// Health check endpoint for Railway
const express = require('express');
const healthApp = express();
const healthPort = process.env.PORT || 3005;

healthApp.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'telegram-bot',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    bot: bot ? 'connected' : 'disconnected'
  });
});

healthApp.listen(healthPort, () => {
  console.log(`Health check server running on port ${healthPort}`);
});
