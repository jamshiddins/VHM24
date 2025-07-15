/**
 * Скрипт для полного развертывания системы VendHub в Railway
 * Этот скрипт автоматизирует процесс развертывания, описанный в VENDHUB_RAILWAY_DEPLOYMENT_GUIDE.md
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
    // В Windows команда railway может быть доступна как railway.exe
    try {
      const version = executeCommand('railway version');
      log(`✅ Railway CLI установлен, версия: ${version}`, 'success');
      return true;
    } catch (error) {
      // Пробуем с .exe
      try {
        const version = executeCommand('railway.exe version');
        log(`✅ Railway CLI установлен, версия: ${version}`, 'success');
        return true;
      } catch (exeError) {
        throw error; // Если обе команды не работают, выбрасываем исходную ошибку
      }
    }
  } catch (error) {
    log('❌ Railway CLI не установлен', 'error');
    log('Установка Railway CLI...', 'info');
    
    try {
      // Установка Railway CLI
      executeCommand('npm install -g @railway/cli');
      
      // Проверка установки
      try {
        const version = executeCommand('railway version');
        log(`✅ Railway CLI успешно установлен, версия: ${version}`, 'success');
        return true;
      } catch (error) {
        try {
          const version = executeCommand('railway.exe version');
          log(`✅ Railway CLI успешно установлен, версия: ${version}`, 'success');
          return true;
        } catch (exeError) {
          throw error;
        }
      }
    } catch (installError) {
      log(`❌ Не удалось установить Railway CLI: ${installError.message}`, 'error');
      log('Пожалуйста, установите Railway CLI вручную: npm install -g @railway/cli', 'warning');
      return false;
    }
  }
}

// Функция для проверки наличия файлов конфигурации
function checkConfigFiles() {
  log('Проверка наличия файлов конфигурации...', 'info');
  
  // Проверка наличия файла railway.toml
  const railwayTomlPath = path.join(__dirname, 'railway.toml');
  if (!fs.existsSync(railwayTomlPath)) {
    log('Файл railway.toml не найден, создаем...', 'warning');
    
    const railwayTomlContent = `[build]
builder = "nixpacks"
buildCommand = "npm install && cd backend && npx prisma generate && npm run build"

[deploy]
startCommand = "npm start"
healthcheckPath = "/api/health"
healthcheckTimeout = 100
restartPolicyType = "on-failure"
restartPolicyMaxRetries = 10
`;
    
    fs.writeFileSync(railwayTomlPath, railwayTomlContent);
    log('✅ Файл railway.toml успешно создан', 'success');
  } else {
    log('✅ Файл railway.toml найден', 'success');
  }
  
  // Проверка наличия файла nixpacks.toml
  const nixpacksTomlPath = path.join(__dirname, 'nixpacks.toml');
  if (!fs.existsSync(nixpacksTomlPath)) {
    log('Файл nixpacks.toml не найден, создаем...', 'warning');
    
    const nixpacksTomlContent = `[phases.setup]
nixPkgs = ["nodejs", "npm", "postgresql"]

[phases.install]
cmds = ["npm install"]

[phases.build]
cmds = ["cd backend && npx prisma generate", "npm run build"]

[start]
cmd = "npm start"
`;
    
    fs.writeFileSync(nixpacksTomlPath, nixpacksTomlContent);
    log('✅ Файл nixpacks.toml успешно создан', 'success');
  } else {
    log('✅ Файл nixpacks.toml найден', 'success');
  }
  
  // Проверка наличия файла .env.railway.example
  const envRailwayExamplePath = path.join(__dirname, '.env.railway.example');
  if (!fs.existsSync(envRailwayExamplePath)) {
    log('Файл .env.railway.example не найден, создаем...', 'warning');
    
    const envRailwayExampleContent = `# Пример файла .env для Railway
# Скопируйте этот файл в .env и заполните переменные окружения

# Основные настройки
NODE_ENV=production
PORT=3000

# База данных
DATABASE_URL=postgresql://postgres:password@localhost:5432/vendhub

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
WEBHOOK_URL=https://your-app.railway.app/api/telegram/webhook
API_BASE_URL=https://your-app.railway.app

# S3 хранилище (опционально)
S3_ENDPOINT=your_s3_endpoint
S3_ACCESS_KEY=your_s3_access_key
S3_SECRET_KEY=your_s3_secret_key
S3_BUCKET=your_s3_bucket
S3_REGION=your_s3_region
`;
    
    fs.writeFileSync(envRailwayExamplePath, envRailwayExampleContent);
    log('✅ Файл .env.railway.example успешно создан', 'success');
  } else {
    log('✅ Файл .env.railway.example найден', 'success');
  }
  
  return true;
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
      // Пробуем с .exe
      try {
        const whoami = executeCommand('railway.exe whoami');
        log(`✅ Вы уже авторизованы в Railway как: ${whoami}`, 'success');
        return true;
      } catch (exeError) {
        // Пользователь не авторизован, выполняем вход
        log('Вы не авторизованы в Railway, выполняем вход...', 'warning');
        
        log('Для входа в Railway откроется браузер. Пожалуйста, авторизуйтесь в браузере.', 'info');
        try {
          executeCommand('railway login');
        } catch (error) {
          try {
            executeCommand('railway.exe login');
          } catch (exeError) {
            throw error;
          }
        }
        
        // Проверка успешности входа
        try {
          const whoami = executeCommand('railway whoami');
          log(`✅ Вы успешно авторизовались в Railway как: ${whoami}`, 'success');
          return true;
        } catch (error) {
          try {
            const whoami = executeCommand('railway.exe whoami');
            log(`✅ Вы успешно авторизовались в Railway как: ${whoami}`, 'success');
            return true;
          } catch (exeError) {
            log(`❌ Не удалось авторизоваться в Railway: ${error.message}`, 'error');
            return false;
          }
        }
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
      try {
        const currentProject = executeCommand('railway.exe project');
        log(`✅ Текущий проект Railway: ${currentProject}`, 'success');
        return currentProject;
      } catch (exeError) {
        // Проект не выбран, создаем новый
        log('Проект не выбран, создаем новый...', 'warning');
        
        // Создание нового проекта
        const projectName = 'vendhub-' + Math.floor(Date.now() / 1000);
        try {
          executeCommand(`railway project create ${projectName}`);
        } catch (error) {
          try {
            executeCommand(`railway.exe project create ${projectName}`);
          } catch (exeError) {
            throw error;
          }
        }
        
        // Проверка создания проекта
        try {
          const currentProject = executeCommand('railway project');
          log(`✅ Создан новый проект Railway: ${currentProject}`, 'success');
          return currentProject;
        } catch (error) {
          try {
            const currentProject = executeCommand('railway.exe project');
            log(`✅ Создан новый проект Railway: ${currentProject}`, 'success');
            return currentProject;
          } catch (exeError) {
            throw error;
          }
        }
      }
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
        try {
          executeCommand('railway plugin add postgresql');
        } catch (error) {
          try {
            executeCommand('railway.exe plugin add postgresql');
          } catch (exeError) {
            throw error;
          }
        }
        
        log('✅ База данных PostgreSQL успешно создана', 'success');
        return true;
      }
    } catch (error) {
      try {
        const plugins = executeCommand('railway.exe plugin list');
        
        if (plugins.includes('postgresql')) {
          log('✅ База данных PostgreSQL уже создана', 'success');
          return true;
        } else {
          // База данных не создана, создаем новую
          log('База данных PostgreSQL не создана, создаем новую...', 'warning');
          
          // Создание базы данных PostgreSQL
          try {
            executeCommand('railway.exe plugin add postgresql');
          } catch (exeError) {
            throw error;
          }
          
          log('✅ База данных PostgreSQL успешно создана', 'success');
          return true;
        }
      } catch (exeError) {
        // Ошибка при проверке плагинов, создаем базу данных
        log('Ошибка при проверке плагинов, создаем базу данных...', 'warning');
        
        // Создание базы данных PostgreSQL
        try {
          executeCommand('railway plugin add postgresql');
        } catch (error) {
          try {
            executeCommand('railway.exe plugin add postgresql');
          } catch (exeError) {
            throw error;
          }
        }
        
        log('✅ База данных PostgreSQL успешно создана', 'success');
        return true;
      }
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
    let envVars;
    try {
      envVars = executeCommand('railway variables get');
    } catch (error) {
      try {
        envVars = executeCommand('railway.exe variables get');
      } catch (exeError) {
        throw error;
      }
    }
    
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
      } else if (fs.existsSync(path.join(__dirname, '.env.railway.example'))) {
        log('Создание файла .env из .env.railway.example...', 'info');
        fs.copyFileSync(path.join(__dirname, '.env.railway.example'), path.join(__dirname, '.env'));
      } else {
        log('❌ Файлы .env.example и .env.railway.example не найдены', 'error');
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
    
    // Запрос токена Telegram бота
    log('Введите токен Telegram бота (или нажмите Enter, чтобы использовать существующий):', 'info');
    const telegramBotToken = await new Promise(resolve => {
      process.stdin.once('data', data => {
        resolve(data.toString().trim());
      });
    });
    
    // Обновление TELEGRAM_BOT_TOKEN
    if (telegramBotToken) {
      if (envContent.includes('TELEGRAM_BOT_TOKEN=')) {
        envContent = envContent.replace(/TELEGRAM_BOT_TOKEN=.*/, `TELEGRAM_BOT_TOKEN=${telegramBotToken}`);
      } else {
        envContent += `\nTELEGRAM_BOT_TOKEN=${telegramBotToken}`;
      }
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
          try {
            executeCommand(`railway variables set ${key.trim()}=${value.trim()}`);
          } catch (error) {
            try {
              executeCommand(`railway.exe variables set ${key.trim()}=${value.trim()}`);
            } catch (exeError) {
              log(`❌ Ошибка при установке переменной ${key.trim()}: ${error.message}`, 'error');
            }
          }
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

// Функция для развертывания приложения
async function deployApplication() {
  log('Развертывание приложения...', 'info');
  
  try {
    // Развертывание приложения
    try {
      executeCommand('railway up');
    } catch (error) {
      try {
        executeCommand('railway.exe up');
      } catch (exeError) {
        throw error;
      }
    }
    
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
    let appURL;
    try {
      appURL = executeCommand('railway service');
    } catch (error) {
      try {
        appURL = executeCommand('railway.exe service');
      } catch (exeError) {
        throw error;
      }
    }
    
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
    let envVars;
    try {
      envVars = executeCommand('railway variables get');
    } catch (error) {
      try {
        envVars = executeCommand('railway.exe variables get');
      } catch (exeError) {
        throw error;
      }
    }
    
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
    log(`Отправка запроса к API Telegram: ${telegramAPIURL}`, 'info');
    log('Пожалуйста, откройте эту ссылку в браузере для настройки вебхука:', 'info');
    log(telegramAPIURL, 'info');
    
    log('✅ Инструкции по настройке вебхука Telegram отправлены', 'success');
    return true;
  } catch (error) {
    log(`❌ Ошибка при настройке вебхука Telegram: ${error.message}`, 'error');
    return false;
  }
}

// Главная функция
async function main() {
  log('=== РАЗВЕРТЫВАНИЕ СИСТЕМЫ VENDHUB В RAILWAY ===', 'title');
  
  try {
    // Проверка наличия файлов конфигурации
    const configFilesChecked = checkConfigFiles();
    
    if (!configFilesChecked) {
      log('❌ Не удалось проверить файлы конфигурации', 'error');
      return;
    }
    
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
    
    // Вывод итогового результата
    log('=== ИТОГОВЫЙ РЕЗУЛЬТАТ ===', 'title');
    log(`✅ Система VendHub успешно развернута в Railway`, 'success');
    log(`✅ URL приложения: ${appURL}`, 'success');
    log(`✅ URL API: ${appURL}/api`, 'success');
    log(`✅ URL вебхука Telegram: ${appURL}/api/telegram/webhook`, 'success');
    log(`✅ Проект Railway: ${projectName}`, 'success');
    
    log('', 'info');
    log('Для управления проектом в Railway выполните команду:', 'info');
    log('railway open', 'info');
    
    log('', 'info');
    log('Для проверки работоспособности API, откройте в браузере:', 'info');
    log(`${appURL}/api/health`, 'info');
    
    log('', 'info');
    log('Для проверки работоспособности бота, отправьте сообщение боту в Telegram', 'info');
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
