#!/usr/bin/env node
/**
 * Скрипт для деплоя проекта в Railway
 * Запускается командой: npm run deploy:railway
 */

require('dotenv').config();
const { execSync } = require('child_process');
const readline = require('readline');

// Создание интерфейса для чтения ввода пользователя
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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
    return null;
  }
}

// Функция для проверки наличия Railway CLI
function checkRailwayCLI() {
  try {
    // Проверка наличия Railway CLI
    try {
      const help = executeCommand('railway --help');
      log(`✅ Railway CLI установлен`, 'success');
      return true;
    } catch (error) {
      throw error;
    }
  } catch (error) {
    log('❌ Railway CLI не установлен', 'error');
    log('Установка Railway CLI...', 'info');
    
    try {
      // Установка Railway CLI
      executeCommand('npm install -g @railway/cli');
      
      // Проверка установки
      try {
        const help = executeCommand('railway --help');
        log(`✅ Railway CLI успешно установлен`, 'success');
        return true;
      } catch (error) {
        throw error;
      }
    } catch (installError) {
      log(`❌ Не удалось установить Railway CLI: ${installError.message}`, 'error');
      log('Пожалуйста, установите Railway CLI вручную: npm install -g @railway/cli', 'warning');
      return false;
    }
  }
}

// Функция для входа в Railway
async function loginToRailway() {
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
      try {
        executeCommand('railway login');
      } catch (error) {
        throw error;
      }
      
      // Проверка успешности входа
      try {
        const whoami = executeCommand('railway whoami');
        log(`✅ Вы успешно авторизовались в Railway как: ${whoami}`, 'success');
        return true;
      } catch (error) {
        log(`❌ Не удалось авторизоваться в Railway: ${error.message}`, 'error');
        return false;
      }
    }
  } catch (error) {
    log(`❌ Ошибка при входе в Railway: ${error.message}`, 'error');
    return false;
  }
}

// Функция для проверки наличия проекта
async function checkProject() {
  try {
    // Проверка наличия существующего проекта
    try {
      const currentProject = executeCommand('railway link');
      log(`✅ Текущий проект Railway: ${currentProject}`, 'success');
      return currentProject;
    } catch (error) {
      log('❌ Проект не выбран', 'error');
      
      // Запрос у пользователя, хочет ли он выбрать проект
      return new Promise((resolve) => {
        rl.question('Хотите выбрать проект? (y/n): ', async (answer) => {
          if (answer.toLowerCase() === 'y') {
            // Выбор проекта
            try {
              executeCommand('railway link');
            } catch (error) {
              console.error(`❌ Не удалось выбрать проект: ${error.message}`);
              resolve(null);
              return;
            }
            
            // Проверка выбора проекта
            try {
              const currentProject = executeCommand('railway link');
              log(`✅ Выбран проект Railway: ${currentProject}`, 'success');
              resolve(currentProject);
            } catch (error) {
              console.error(`❌ Не удалось получить информацию о проекте: ${error.message}`);
              resolve(null);
            }
          } else {
            log('Выбор проекта отменен', 'warning');
            resolve(null);
          }
        });
      });
    }
  } catch (error) {
    log(`❌ Ошибка при проверке проекта: ${error.message}`, 'error');
    return null;
  }
}

// Функция для проверки переменных окружения
function checkEnvironmentVariables() {
  log('Проверка переменных окружения...', 'info');
  
  // Список обязательных переменных окружения
  const requiredVariables = [
    'DATABASE_URL',
    'JWT_SECRET',
    'TELEGRAM_BOT_TOKEN',
    'REDIS_URL',
    'PORT',
    'NODE_ENV',
    'RAILWAY_PUBLIC_URL',
    'WEBHOOK_URL'
  ];
  
  // Получение текущих переменных окружения из Railway
  let currentEnvVars = {};
  try {
    const railwayEnvVars = executeCommand('railway variables');
    const lines = railwayEnvVars.split('\n');
    
    for (const line of lines) {
      if (line.trim()) {
        const [key, value] = line.split('=');
        if (key && value) {
          currentEnvVars[key.trim()] = value.trim();
        }
      }
    }
  } catch (error) {
    log(`⚠️ Не удалось получить текущие переменные окружения: ${error.message}`, 'warning');
  }
  
  // Проверка наличия обязательных переменных окружения
  const missingVariables = [];
  for (const variable of requiredVariables) {
    if (!currentEnvVars[variable]) {
      missingVariables.push(variable);
    }
  }
  
  if (missingVariables.length > 0) {
    log(`❌ Отсутствуют обязательные переменные окружения: ${missingVariables.join(', ')}`, 'error');
    log('Пожалуйста, настройте переменные окружения с помощью команды: npm run setup:railway-variables', 'warning');
    return false;
  }
  
  log('✅ Все обязательные переменные окружения настроены', 'success');
  return true;
}

// Функция для деплоя в Railway
async function deployToRailway() {
  log('Деплой в Railway...', 'info');
  
  try {
    // Деплой в Railway
    try {
      executeCommand('railway up');
    } catch (error) {
      throw error;
    }
    
    log('✅ Деплой в Railway успешно выполнен', 'success');
    return true;
  } catch (error) {
    log(`❌ Ошибка при деплое в Railway: ${error.message}`, 'error');
    return false;
  }
}

// Функция для получения URL приложения
async function getApplicationURL() {
  log('Получение URL приложения...', 'info');
  
  try {
    // Получение URL приложения
    let appUrl;
    try {
      appUrl = executeCommand('railway status');
    } catch (error) {
      throw error;
    }
    
    // Извлечение URL из вывода команды
    const urlMatch = appUrl.match(/https:\/\/[^\s]+/);
    
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

// Главная функция
async function main() {
  log('=== ДЕПЛОЙ ПРОЕКТА В RAILWAY ===', 'title');
  
  try {
    // Проверка наличия Railway CLI
    const railwayCLIInstalled = checkRailwayCLI();
    
    if (!railwayCLIInstalled) {
      log('❌ Не удалось установить Railway CLI', 'error');
      rl.close();
      return;
    }
    
    // Вход в Railway
    const loggedIn = await loginToRailway();
    
    if (!loggedIn) {
      log('❌ Не удалось войти в Railway', 'error');
      rl.close();
      return;
    }
    
    // Проверка наличия проекта
    const projectName = await checkProject();
    
    if (!projectName) {
      log('❌ Не удалось выбрать проект', 'error');
      rl.close();
      return;
    }
    
    // Проверка переменных окружения
    const environmentVariablesOK = checkEnvironmentVariables();
    
    if (!environmentVariablesOK) {
      await new Promise((resolve) => {
        rl.question('Хотите продолжить деплой без настройки переменных окружения? (y/n): ', (answer) => {
          if (answer.toLowerCase() !== 'y') {
            log('Деплой отменен', 'warning');
            rl.close();
            process.exit(0);
          }
          resolve();
        });
      });
    }
    
    // Деплой в Railway
    const deploySuccessful = await deployToRailway();
    
    if (!deploySuccessful) {
      log('❌ Не удалось выполнить деплой в Railway', 'error');
      rl.close();
      return;
    }
    
    // Получение URL приложения
    const appURL = await getApplicationURL();
    
    if (!appURL) {
      log('❌ Не удалось получить URL приложения', 'error');
      rl.close();
      return;
    }
    
    // Вывод итогового результата
    log('=== ИТОГОВЫЙ РЕЗУЛЬТАТ ===', 'title');
    log(`✅ Проект успешно задеплоен в Railway`, 'success');
    log(`✅ URL приложения: ${appURL}`, 'success');
    log(`✅ Проект Railway: ${projectName}`, 'success');
    
    log('', 'info');
    log('Для управления проектом в Railway выполните команду:', 'info');
    log('railway open', 'info');
    
    log('', 'info');
    log('Для проверки работоспособности API, откройте в браузере:', 'info');
    log(`${appURL}/health`, 'info');
    
    log('', 'info');
    log('Для настройки вебхука Telegram-бота выполните команду:', 'info');
    log('npm run setup:webhook', 'info');
    
    rl.close();
  } catch (error) {
    log(`❌ Критическая ошибка: ${error.message}`, 'error');
    rl.close();
    process.exit(1);
  }
}

// Запуск скрипта
main().catch(error => {
  log(`❌ Критическая ошибка: ${error.message}`, 'error');
  rl.close();
  process.exit(1);
});
