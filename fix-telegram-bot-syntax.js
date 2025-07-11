const fs = require('fs');
const path = require('path');

console.log('🔧 Исправление синтаксических ошибок в Telegram боте...');

const botIndexPath = 'services/telegram-bot/src/index.js';

// Читаем файл
let content = fs.readFileSync(botIndexPath, 'utf8');

// Исправляем импорты
content = content.replace(
  /const { handleStart \s*\n\s*} catch \(error\) {\s*logger\.error\('Error:', error\);\s*throw error;\s*}\s*} catch \(error\) {\s*logger\.error\('Error:', error\);\s*throw error;\s*} catch \(error\) {\s*logger\.error\('Error:', error\);\s*throw error;\s*}\s*}\s*} = require\('\.\/handlers\/startHandler\.js'\);/g,
  "const { handleStart } = require('./handlers/startHandler.js');"
);

content = content.replace(
  /const { handleMachines \s*} catch \(error\) {\s*logger\.error\('Error:', error\);\s*throw error;\s*}\s*} = require\('\.\/handlers\/machinesHandler\.js'\);/g,
  "const { handleMachines } = require('./handlers/machinesHandler.js');"
);

content = content.replace(
  /const { handleInventory \s*} catch \(error\) {\s*logger\.error\('Error:', error\);\s*throw error;\s*}\s*} = require\('\.\/handlers\/inventoryHandler\.js'\);/g,
  "const { handleInventory } = require('./handlers/inventoryHandler.js');"
);

content = content.replace(
  /const { handleTasks \s*} catch \(error\) {\s*logger\.error\('Error:', error\);\s*throw error;\s*}\s*} = require\('\.\/handlers\/tasksHandler\.js'\);/g,
  "const { handleTasks } = require('./handlers/tasksHandler.js');"
);

content = content.replace(
  /const { handleReports \s*} catch \(error\) {\s*logger\.error\('Error:', error\);\s*throw error;\s*}\s*} = require\('\.\/handlers\/reportsHandler\.js'\);/g,
  "const { handleReports } = require('./handlers/reportsHandler.js');"
);

content = content.replace(
  /const { handleSettings \s*} catch \(error\) {\s*logger\.error\('Error:', error\);\s*throw error;\s*}\s*} = require\('\.\/handlers\/settingsHandler\.js'\);/g,
  "const { handleSettings } = require('./handlers/settingsHandler.js');"
);

content = content.replace(
  /const { handleCallbackQuery \s*} catch \(error\) {\s*logger\.error\('Error:', error\);\s*throw error;\s*}\s*} = require\('\.\/handlers\/callbackHandler\.js'\);/g,
  "const { handleCallbackQuery } = require('./handlers/callbackHandler.js');"
);

content = content.replace(
  /const { TechnicianHandler \s*} catch \(error\) {\s*logger\.error\('Error:', error\);\s*throw error;\s*}\s*} = require\('\.\/handlers\/technicianHandler\.js'\);/g,
  "const { TechnicianHandler } = require('./handlers/technicianHandler.js');"
);

content = content.replace(
  /const { \s*REGISTRATION_STATES,[\s\S]*?isTechnicianState \s*} catch \(error\) {\s*logger\.error\('Error:', error\);\s*throw error;\s*}\s*} = require\('\.\/fsm\/states\.js'\);/g,
  `const { 
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
} = require('./fsm/states.js');`
);

content = content.replace(
  /const { checkAuth \s*} catch \(error\) {\s*logger\.error\('Error:', error\);\s*throw error;\s*}\s*} = require\('\.\/utils\/auth\.js'\);/g,
  "const { checkAuth } = require('./utils/auth.js');"
);

content = content.replace(
  /const { errorHandler \s*} catch \(error\) {\s*logger\.error\('Error:', error\);\s*throw error;\s*}\s*} = require\('\.\/utils\/errorHandler\.js'\);/g,
  "const { errorHandler } = require('./utils/errorHandler.js');"
);

// Исправляем dotenv.config
content = content.replace(
  /dotenv\.config\({ path: path\.join\(__dirname, '\.\.\/\.\.\/\.\.\/\.env'\) \s*} catch \(error\) {\s*logger\.error\('Error:', error\);\s*throw error;\s*}\s*}\);/g,
  "dotenv.config({ path: path.join(__dirname, '../../../.env') });"
);

// Исправляем winston logger
content = content.replace(
  /]\s*} catch \(error\) {\s*logger\.error\('Error:', error\);\s*throw error;\s*}\s*}\);/g,
  ']);'
);

// Исправляем config объект
content = content.replace(
  /}\s*} catch \(error\) {\s*logger\.error\('Error:', error\);\s*throw error;\s*}\s*};/g,
  '};'
);

// Исправляем if блоки
content = content.replace(
  /process\.exit\(1\);\s*} catch \(error\) {\s*logger\.error\('Error:', error\);\s*throw error;\s*}\s*}/g,
  'process.exit(1);'
);

// Исправляем bot создание
content = content.replace(
  /\.catch\(error => logger\.error\('Failed to set webhook:', error\)\);\s*} catch \(error\) {\s*logger\.error\('Error:', error\);\s*throw error;\s*}\s*} else {/g,
  ".catch(error => logger.error('Failed to set webhook:', error));\n} else {"
);

content = content.replace(
  /bot = new TelegramBot\(config\.telegramToken, { polling: config\.polling }\);\s*} catch \(error\) {\s*logger\.error\('Error:', error\);\s*throw error;\s*}\s*}/g,
  'bot = new TelegramBot(config.telegramToken, { polling: config.polling });'
);

// Исправляем error handlers
content = content.replace(
  /logger\.error\('Polling error:', error\);\s*} catch \(error\) {\s*logger\.error\('Error:', error\);\s*throw error;\s*}\s*}\);/g,
  "logger.error('Polling error:', error);\n});"
);

content = content.replace(
  /logger\.error\('Webhook error:', error\);\s*} catch \(error\) {\s*logger\.error\('Error:', error\);\s*throw error;\s*}\s*}\);/g,
  "logger.error('Webhook error:', error);\n});"
);

// Исправляем axios config
content = content.replace(
  /}\s*} catch \(error\) {\s*logger\.error\('Error:', error\);\s*throw error;\s*}\s*}\);/g,
  '});'
);

// Исправляем interceptors
content = content.replace(
  /return config;\s*} catch \(error\) {\s*logger\.error\('Error:', error\);\s*throw error;\s*}\s*}\);/g,
  'return config;\n});'
);

content = content.replace(
  /throw error;\s*} catch \(error\) {\s*logger\.error\('Error:', error\);\s*throw error;\s*}\s*}/g,
  'throw error;'
);

// Исправляем async функции
content = content.replace(
  /\(\(\) => {\s*try {\s*try {\s*try {/g,
  '(async () => {\n  try {'
);

// Исправляем /help команду
content = content.replace(
  /bot\.onText\(\/\\\/help\/, async \(msg\) => {\s*try {\s*try {/g,
  'bot.onText(/\\/help/, async (msg) => {\n  try {'
);

content = content.replace(
  /await bot\.sendMessage\(msg\.chat\.id, helpText\);\s*}\);/g,
  'await bot.sendMessage(msg.chat.id, helpText);\n  } catch (error) {\n    await errorHandler(bot, msg, error);\n  }\n});'
);

// Исправляем message handler
content = content.replace(
  /bot\.on\('message', async \(msg\) => {\s*try {\s*try {/g,
  "bot.on('message', async (msg) => {\n  try {"
);

// Исправляем health check
content = content.replace(
  /healthApp\.get\('\/health', async \(req, res\) => {\s*try {\s*try {/g,
  "healthApp.get('/health', async (req, res) => {\n  try {"
);

// Записываем исправленный файл
fs.writeFileSync(botIndexPath, content, 'utf8');

console.log('✅ Синтаксические ошибки в Telegram боте исправлены');
console.log('🚀 Перезапуск Telegram бота...');

// Перезапускаем бота
const { spawn } = require('child_process');

const botProcess = spawn('npm', ['start'], {
  cwd: 'services/telegram-bot',
  shell: true,
  stdio: 'inherit'
});

console.log('✅ Telegram бот перезапущен');
