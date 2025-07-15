/**
 * Скрипт для полного развертывания системы VendHub в онлайн-сервисе Railway
 */

require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Цвета для вывода в консоль
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Функция для логирования
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  let color = colors.white;
  
  switch (type) {
    case 'success':
      color = colors.green;
      break;
    case 'error':
      color = colors.red;
      break;
    case 'warning':
      color = colors.yellow;
      break;
    case 'info':
      color = colors.blue;
      break;
    case 'title':
      color = colors.magenta;
      break;
    default:
      color = colors.white;
  }
  
  console.log(`${color}[${timestamp}] [${type.toUpperCase()}] ${message}${colors.reset}`);
}

// Функция для выполнения команды и возврата результата
function executeCommand(command, options = {}) {
  try {
    log(`Выполнение команды: ${command}`, 'info');
    const result = execSync(command, { encoding: 'utf8', ...options });
    return result.trim();
  } catch (error) {
    log(`Ошибка выполнения команды: ${error.message}`, 'error');
    if (error.stdout) log(`Вывод stdout: ${error.stdout}`, 'error');
    if (error.stderr) log(`Вывод stderr: ${error.stderr}`, 'error');
    throw error;
  }
}

// Функция для проверки наличия Railway CLI
async function checkRailwayCLI() {
  log('Проверка наличия Railway CLI...', 'info');
  
  try {
    const version = executeCommand('railway version');
    log(`✅ Railway CLI установлен, версия: ${version}`, 'success');
    return true;
  } catch (error) {
    log('❌ Railway CLI не установлен', 'error');
    log('Установка Railway CLI...', 'info');
    
    try {
      // Установка Railway CLI
      executeCommand('npm install -g @railway/cli');
      
      // Проверка установки
      const version = executeCommand('railway version');
      log(`✅ Railway CLI успешно установлен, версия: ${version}`, 'success');
      return true;
    } catch (installError) {
      log(`❌ Не удалось установить Railway CLI: ${installError.message}`, 'error');
      log('Пожалуйста, установите Railway CLI вручную: npm install -g @railway/cli', 'warning');
      return false;
    }
  }
}

// Функция для входа в Railway
async function loginToRailway() {
  log('Вход в Railway...', 'info');
  
  try {
    // Проверка, авторизован ли пользователь
    try {
      const whoami = executeCommand('railway whoami');
      log(`✅ Вы уже авторизованы в Railway как: ${whoami}`, 'success');
      return true;
    } catch (error) {
      // Пользователь не авторизован, выполняем вход
      log('Вы не авторизованы в Railway, выполняем вход...', 'warning');
      
      log('Для входа в Railway откроется браузер. Пожалуйста, авторизуйтесь в браузере.', 'info');
      executeCommand('railway login');
      
      // Проверка успешности входа
      try {
        const whoami = executeCommand('railway whoami');
        log(`✅ Вы успешно авторизовались в Railway как: ${whoami}`, 'success');
        return true;
      } catch (loginError) {
        log(`❌ Не удалось авторизоваться в Railway: ${loginError.message}`, 'error');
        return false;
      }
    }
  } catch (error) {
    log(`❌ Ошибка при входе в Railway: ${error.message}`, 'error');
    return false;
  }
}

// Функция для создания проекта в Railway
async function createRailwayProject() {
  log('Создание проекта в Railway...', 'info');
  
  try {
    // Проверка наличия существующего проекта
    try {
      const currentProject = executeCommand('railway project');
      log(`✅ Текущий проект Railway: ${currentProject}`, 'success');
      return currentProject;
    } catch (error) {
      // Проект не выбран, создаем новый
      log('Проект не выбран, создаем новый...', 'warning');
      
      // Создание нового проекта
      const projectName = 'vendhub-' + Math.floor(Date.now() / 1000);
      executeCommand(`railway project create ${projectName}`);
      
      // Проверка создания проекта
      const currentProject = executeCommand('railway project');
      log(`✅ Создан новый проект Railway: ${currentProject}`, 'success');
      return currentProject;
    }
  } catch (error) {
    log(`❌ Ошибка при создании проекта в Railway: ${error.message}`, 'error');
    return null;
  }
}

// Функция для создания базы данных PostgreSQL в Railway
async function createPostgresDatabase() {
  log('Создание базы данных PostgreSQL в Railway...', 'info');
  
  try {
    // Проверка наличия существующей базы данных
    try {
      const plugins = executeCommand('railway plugin list');
      
      if (plugins.includes('postgresql')) {
        log('✅ База данных PostgreSQL уже создана', 'success');
        return true;
      } else {
        // База данных не создана, создаем новую
        log('База данных PostgreSQL не создана, создаем новую...', 'warning');
        
        // Создание базы данных PostgreSQL
        executeCommand('railway plugin add postgresql');
        
        log('✅ База данных PostgreSQL успешно создана', 'success');
        return true;
      }
    } catch (error) {
      // Ошибка при проверке плагинов, создаем базу данных
      log('Ошибка при проверке плагинов, создаем базу данных...', 'warning');
      
      // Создание базы данных PostgreSQL
      executeCommand('railway plugin add postgresql');
      
      log('✅ База данных PostgreSQL успешно создана', 'success');
      return true;
    }
  } catch (error) {
    log(`❌ Ошибка при создании базы данных PostgreSQL: ${error.message}`, 'error');
    return false;
  }
}

// Функция для получения URL базы данных
async function getDatabaseURL() {
  log('Получение URL базы данных...', 'info');
  
  try {
    // Получение переменных окружения
    const envVars = executeCommand('railway variables get');
    const lines = envVars.split('\n');
    
    // Поиск DATABASE_URL
    for (const line of lines) {
      if (line.includes('DATABASE_URL')) {
        const databaseURL = line.split('=')[1].trim();
        log(`✅ URL базы данных получен: ${databaseURL.substring(0, 20)}...`, 'success');
        return databaseURL;
      }
    }
    
    log('❌ URL базы данных не найден', 'error');
    return null;
  } catch (error) {
    log(`❌ Ошибка при получении URL базы данных: ${error.message}`, 'error');
    return null;
  }
}

// Функция для настройки переменных окружения
async function setupEnvironmentVariables() {
  log('Настройка переменных окружения...', 'info');
  
  try {
    // Получение URL базы данных
    const databaseURL = await getDatabaseURL();
    
    if (!databaseURL) {
      log('❌ Не удалось получить URL базы данных', 'error');
      return false;
    }
    
    // Проверка наличия файла .env
    if (!fs.existsSync(path.join(__dirname, '.env'))) {
      log('❌ Файл .env не найден', 'error');
      
      // Проверка наличия файла .env.example
      if (fs.existsSync(path.join(__dirname, '.env.example'))) {
        log('Создание файла .env из .env.example...', 'info');
        fs.copyFileSync(path.join(__dirname, '.env.example'), path.join(__dirname, '.env'));
      } else {
        log('❌ Файл .env.example не найден', 'error');
        return false;
      }
    }
    
    // Чтение файла .env
    let envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    
    // Обновление DATABASE_URL
    if (envContent.includes('DATABASE_URL=')) {
      envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL=${databaseURL}`);
    } else {
      envContent += `\nDATABASE_URL=${databaseURL}`;
    }
    
    // Обновление PORT
    if (envContent.includes('PORT=')) {
      envContent = envContent.replace(/PORT=.*/, 'PORT=3000');
    } else {
      envContent += '\nPORT=3000';
    }
    
    // Обновление NODE_ENV
    if (envContent.includes('NODE_ENV=')) {
      envContent = envContent.replace(/NODE_ENV=.*/, 'NODE_ENV=production');
    } else {
      envContent += '\nNODE_ENV=production';
    }
    
    // Запись обновленного файла .env
    fs.writeFileSync(path.join(__dirname, '.env'), envContent);
    
    // Загрузка переменных окружения в Railway
    log('Загрузка переменных окружения в Railway...', 'info');
    
    // Чтение файла .env
    const envVars = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    const lines = envVars.split('\n');
    
    // Загрузка каждой переменной
    for (const line of lines) {
      if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        
        if (key && value) {
          executeCommand(`railway variables set ${key.trim()}=${value.trim()}`);
        }
      }
    }
    
    log('✅ Переменные окружения успешно настроены', 'success');
    return true;
  } catch (error) {
    log(`❌ Ошибка при настройке переменных окружения: ${error.message}`, 'error');
    return false;
  }
}

// Функция для миграции базы данных
async function migrateDatabase() {
  log('Миграция базы данных...', 'info');
  
  try {
    // Проверка наличия директории prisma
    if (!fs.existsSync(path.join(__dirname, 'backend', 'prisma'))) {
      log('❌ Директория prisma не найдена', 'error');
      return false;
    }
    
    // Выполнение миграции
    executeCommand('cd backend && npx prisma migrate deploy');
    
    log('✅ Миграция базы данных успешно выполнена', 'success');
    return true;
  } catch (error) {
    log(`❌ Ошибка при миграции базы данных: ${error.message}`, 'error');
    return false;
  }
}

// Функция для развертывания приложения
async function deployApplication() {
  log('Развертывание приложения...', 'info');
  
  try {
    // Проверка наличия файла nixpacks.toml
    if (!fs.existsSync(path.join(__dirname, 'nixpacks.toml'))) {
      log('Создание файла nixpacks.toml...', 'info');
      
      const nixpacksContent = `[phases.setup]
nixPkgs = ["nodejs", "yarn", "postgresql"]

[phases.install]
cmds = ["yarn install"]

[phases.build]
cmds = ["yarn prisma generate", "yarn build"]

[start]
cmd = "yarn start"
`;
      
      fs.writeFileSync(path.join(__dirname, 'nixpacks.toml'), nixpacksContent);
    }
    
    // Проверка наличия файла railway.toml
    if (!fs.existsSync(path.join(__dirname, 'railway.toml'))) {
      log('Создание файла railway.toml...', 'info');
      
      const railwayTomlContent = `[build]
builder = "nixpacks"
buildCommand = "yarn install && yarn prisma generate && yarn build"

[deploy]
startCommand = "yarn start"
healthcheckPath = "/api/health"
healthcheckTimeout = 100
restartPolicyType = "on-failure"
restartPolicyMaxRetries = 10
`;
      
      fs.writeFileSync(path.join(__dirname, 'railway.toml'), railwayTomlContent);
    }
    
    // Развертывание приложения
    executeCommand('railway up');
    
    log('✅ Приложение успешно развернуто', 'success');
    return true;
  } catch (error) {
    log(`❌ Ошибка при развертывании приложения: ${error.message}`, 'error');
    return false;
  }
}

// Функция для получения URL развернутого приложения
async function getApplicationURL() {
  log('Получение URL развернутого приложения...', 'info');
  
  try {
    // Получение URL приложения
    const appURL = executeCommand('railway service');
    
    // Извлечение URL из вывода команды
    const urlMatch = appURL.match(/https:\/\/[^\s]+/);
    
    if (urlMatch) {
      const url = urlMatch[0];
      log(`✅ URL приложения: ${url}`, 'success');
      return url;
    } else {
      log('❌ Не удалось получить URL приложения', 'error');
      return null;
    }
  } catch (error) {
    log(`❌ Ошибка при получении URL приложения: ${error.message}`, 'error');
    return null;
  }
}

// Функция для настройки вебхука Telegram
async function setupTelegramWebhook(appURL) {
  log('Настройка вебхука Telegram...', 'info');
  
  try {
    // Получение токена бота из переменных окружения
    const envVars = executeCommand('railway variables get');
    const lines = envVars.split('\n');
    let botToken = null;
    
    // Поиск TELEGRAM_BOT_TOKEN
    for (const line of lines) {
      if (line.includes('TELEGRAM_BOT_TOKEN')) {
        botToken = line.split('=')[1].trim();
        break;
      }
    }
    
    if (!botToken) {
      log('❌ Токен бота Telegram не найден', 'error');
      return false;
    }
    
    // Формирование URL вебхука
    const webhookURL = `${appURL}/api/telegram/webhook`;
    
    // Настройка вебхука
    const telegramAPIURL = `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookURL)}`;
    
    // Отправка запроса к API Telegram
    const response = await axios.get(telegramAPIURL);
    
    if (response.data && response.data.ok) {
      log(`✅ Вебхук Telegram успешно настроен: ${webhookURL}`, 'success');
      return true;
    } else {
      log(`❌ Ошибка при настройке вебхука Telegram: ${JSON.stringify(response.data)}`, 'error');
      return false;
    }
  } catch (error) {
    log(`❌ Ошибка при настройке вебхука Telegram: ${error.message}`, 'error');
    return false;
  }
}

// Функция для проверки работоспособности приложения
async function checkApplicationHealth(appURL) {
  log('Проверка работоспособности приложения...', 'info');
  
  try {
    // Проверка доступности API
    const healthURL = `${appURL}/api/health`;
    
    // Отправка запроса к API
    const response = await axios.get(healthURL, { timeout: 10000 });
    
    if (response.status === 200) {
      log(`✅ API доступен: ${JSON.stringify(response.data)}`, 'success');
      return true;
    } else {
      log(`❌ API вернул статус ${response.status}`, 'error');
      return false;
    }
  } catch (error) {
    log(`❌ Ошибка при проверке работоспособности приложения: ${error.message}`, 'error');
    return false;
  }
}

// Главная функция
async function main() {
  log('=== РАЗВЕРТЫВАНИЕ СИСТЕМЫ VENDHUB В ОНЛАЙН-СЕРВИСЕ RAILWAY ===', 'title');
  
  try {
    // Проверка наличия Railway CLI
    const railwayCLIInstalled = await checkRailwayCLI();
    
    if (!railwayCLIInstalled) {
      log('❌ Не удалось установить Railway CLI', 'error');
      return;
    }
    
    // Вход в Railway
    const loggedIn = await loginToRailway();
    
    if (!loggedIn) {
      log('❌ Не удалось войти в Railway', 'error');
      return;
    }
    
    // Создание проекта в Railway
    const projectName = await createRailwayProject();
    
    if (!projectName) {
      log('❌ Не удалось создать проект в Railway', 'error');
      return;
    }
    
    // Создание базы данных PostgreSQL
    const databaseCreated = await createPostgresDatabase();
    
    if (!databaseCreated) {
      log('❌ Не удалось создать базу данных PostgreSQL', 'error');
      return;
    }
    
    // Настройка переменных окружения
    const environmentVariablesSetup = await setupEnvironmentVariables();
    
    if (!environmentVariablesSetup) {
      log('❌ Не удалось настроить переменные окружения', 'error');
      return;
    }
    
    // Миграция базы данных
    const databaseMigrated = await migrateDatabase();
    
    if (!databaseMigrated) {
      log('❌ Не удалось выполнить миграцию базы данных', 'error');
      return;
    }
    
    // Развертывание приложения
    const applicationDeployed = await deployApplication();
    
    if (!applicationDeployed) {
      log('❌ Не удалось развернуть приложение', 'error');
      return;
    }
    
    // Получение URL развернутого приложения
    const appURL = await getApplicationURL();
    
    if (!appURL) {
      log('❌ Не удалось получить URL приложения', 'error');
      return;
    }
    
    // Настройка вебхука Telegram
    const webhookSetup = await setupTelegramWebhook(appURL);
    
    if (!webhookSetup) {
      log('❌ Не удалось настроить вебхук Telegram', 'error');
      return;
    }
    
    // Проверка работоспособности приложения
    const applicationHealthy = await checkApplicationHealth(appURL);
    
    if (!applicationHealthy) {
      log('❌ Приложение не работает', 'error');
      return;
    }
    
    // Вывод итогового результата
    log('=== ИТОГОВЫЙ РЕЗУЛЬТАТ ===', 'title');
    log(`✅ Система VendHub успешно развернута в онлайн-сервисе Railway`, 'success');
    log(`✅ URL приложения: ${appURL}`, 'success');
    log(`✅ URL API: ${appURL}/api`, 'success');
    log(`✅ URL вебхука Telegram: ${appURL}/api/telegram/webhook`, 'success');
    log(`✅ Проект Railway: ${projectName}`, 'success');
    
    log('', 'info');
    log('Для управления проектом в Railway выполните команду:', 'info');
    log('railway open', 'info');
  } catch (error) {
    log(`❌ Критическая ошибка: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Запуск скрипта
main().catch(error => {
  log(`❌ Критическая ошибка: ${error.message}`, 'error');
  process.exit(1);
});
