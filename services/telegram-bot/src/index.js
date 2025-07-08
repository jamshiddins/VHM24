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
const bot = new TelegramBot(config.telegramToken, { polling: config.polling });

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

bot.onText(/\/help/, async (msg) => {
  const helpText = `
🤖 *VHM24 Bot Commands*

/start - Start the bot and authenticate
/machines - View and manage vending machines
/inventory - Manage inventory items
/tasks - View and manage tasks
/reports - Generate reports
/settings - Bot settings and preferences
/help - Show this help message

*Quick Actions:*
• Send machine ID to view details
• Send QR code photo to access machine
• Send location to find nearest machines

For support, contact @vhm24_support
  `;

  await bot.sendMessage(msg.chat.id, helpText, { 
    parse_mode: 'Markdown' 
  });
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

// Handle messages with location
bot.on('location', async (msg) => {
  try {
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
    let message = '📍 *Nearest Machines:*\n\n';
    
    machines.forEach((machine, index) => {
      const distance = machine.distance ? `${(machine.distance / 1000).toFixed(1)}km` : 'N/A';
      message += `${index + 1}. *${machine.name}*\n`;
      message += `   📍 ${machine.location || 'No address'}\n`;
      message += `   📏 Distance: ${distance}\n`;
      message += `   🔧 Status: ${machine.status}\n\n`;
    });

    await bot.sendMessage(msg.chat.id, message, { 
      parse_mode: 'Markdown' 
    });
  } catch (error) {
    await errorHandler(bot, msg, error);
  }
});

// Handle photo messages (for QR codes)
bot.on('photo', async (msg) => {
  try {
    if (!await checkAuth(bot, msg)) return;
    
    await bot.sendMessage(msg.chat.id, 
      '📸 QR code scanning is under development.\n' +
      'Please use /machines command to access machines.'
    );
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
