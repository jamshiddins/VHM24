/**
 * Скрипт для проверки и настройки переменных окружения в Railway
 */
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

// Загружаем основной .env файл
const mainEnv = dotenv.config();
dotenvExpand.expand(mainEnv);
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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
    // Проверяем наличие Railway CLI с помощью команды help
    let railwayCliInstalled = false;
    
    try {
      executeCommand('railway help');
      railwayCliInstalled = true;
      log('✅ Railway CLI установлен', 'success');
    } catch (error) {
      try {
        executeCommand('railway.exe help');
        railwayCliInstalled = true;
        log('✅ Railway CLI установлен', 'success');
      } catch (exeError) {
        log('❌ Railway CLI не установлен', 'error');
        log('Установка Railway CLI...', 'info');
        
        try {
          // Установка Railway CLI
          executeCommand('npm install -g @railway/cli');
          
          // Проверка установки с помощью команды help
          try {
            executeCommand('railway help');
            railwayCliInstalled = true;
            log('✅ Railway CLI успешно установлен', 'success');
          } catch (helpError) {
            try {
              executeCommand('railway.exe help');
              railwayCliInstalled = true;
              log('✅ Railway CLI успешно установлен', 'success');
            } catch (helpExeError) {
              throw new Error('Не удалось проверить установку Railway CLI');
            }
          }
        } catch (installError) {
          log(`❌ Не удалось установить Railway CLI: ${installError.message}`, 'error');
          log('Пожалуйста, установите Railway CLI вручную: npm install -g @railway/cli', 'warning');
          
          // Предлагаем альтернативный способ настройки переменных окружения
          log('Для настройки переменных окружения в Railway выполните следующие шаги:', 'info');
          log('1. Установите Railway CLI вручную: npm install -g @railway/cli', 'info');
          log('2. Войдите в Railway: railway login', 'info');
          log('3. Выберите проект: railway project VHM24-1.0', 'info');
          log('4. Установите переменные окружения:', 'info');
          log('   railway variables set DATABASE_URL=postgresql://postgres:tcaqejEXLSdaUdMQXFqEDGBQvavWVbGy@metro.proxy.rlwy.net:36258/railway', 'info');
          log('   railway variables set REDIS_URL=redis://default:RgADgivPNrtbjDUQYGWfzkJnmwCEnPil@redis.railway.internal:6379', 'info');
          log('   railway variables set TELEGRAM_BOT_TOKEN=8015112367:AAHi25gHhI3p1X1uyuCAt8vUnlMZRrcoKEQ', 'info');
          log('   railway variables set PORT=3000', 'info');
          log('   railway variables set RAILWAY_PUBLIC_URL=https://web-production-73916.up.railway.app', 'info');
          log('   railway variables set NODE_ENV=production', 'info');
          log('   railway variables set JWT_SECRET=a8f5f167f44f4964e6c998dee827110c8c8e4c8e8c8e4c8e8c8e4c8e8c8e4c8e8c8e4c8e8c8e4c8e8c8e4c8e8c8e4c8e8c8e4c8e8c8e4c8e', 'info');
          log('   railway variables set ADMIN_IDS=42283329', 'info');
          log('   railway variables set WEBHOOK_URL=https://web-production-73916.up.railway.app/api/telegram/webhook', 'info');
          
          return false;
        }
      }
    }
    
    return railwayCliInstalled;
  } catch (error) {
    log(`❌ Ошибка при проверке наличия Railway CLI: ${error.message}`, 'error');
    return false;
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

// Функция для выбора проекта в Railway
async function selectRailwayProject() {
  log('Выбор проекта в Railway...', 'info');
  
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
        // Проект не выбран, выбираем проект
        log('Проект не выбран, выбираем проект...', 'warning');
        
        // Получение списка проектов
        let projects;
        try {
          projects = executeCommand('railway project list');
        } catch (error) {
          try {
            projects = executeCommand('railway.exe project list');
          } catch (exeError) {
            throw error;
          }
        }
        
        // Проверка наличия проекта VHM24-1.0
        if (projects.includes('VHM24-1.0')) {
          // Выбор проекта VHM24-1.0
          try {
            executeCommand('railway project VHM24-1.0');
          } catch (error) {
            try {
              executeCommand('railway.exe project VHM24-1.0');
            } catch (exeError) {
              throw error;
            }
          }
          
          // Проверка выбора проекта
          try {
            const currentProject = executeCommand('railway project');
            log(`✅ Выбран проект Railway: ${currentProject}`, 'success');
            return currentProject;
          } catch (error) {
            try {
              const currentProject = executeCommand('railway.exe project');
              log(`✅ Выбран проект Railway: ${currentProject}`, 'success');
              return currentProject;
            } catch (exeError) {
              throw error;
            }
          }
        } else {
          log('❌ Проект VHM24-1.0 не найден', 'error');
          log('Пожалуйста, создайте проект VHM24-1.0 в Railway', 'warning');
          return null;
        }
      }
    }
  } catch (error) {
    log(`❌ Ошибка при выборе проекта в Railway: ${error.message}`, 'error');
    return null;
  }
}

// Функция для получения переменных окружения из Railway
async function getRailwayEnvironmentVariables() {
  log('Получение переменных окружения из Railway...', 'info');
  
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
    
    // Парсинг переменных окружения
    const variables = {};
    const lines = envVars.split('\n');
    
    for (const line of lines) {
      if (line.includes('=')) {
        const [key, value] = line.split('=');
        variables[key.trim()] = value.trim();
      }
    }
    
    log(`✅ Получено ${Object.keys(variables).length} переменных окружения из Railway`, 'success');
    return variables;
  } catch (error) {
    log(`❌ Ошибка при получении переменных окружения из Railway: ${error.message}`, 'error');
    return null;
  }
}

// Функция для настройки переменных окружения в Railway
async function setupRailwayEnvironmentVariables() {
  log('Настройка переменных окружения в Railway...', 'info');
  
  try {
    // Получение текущих переменных окружения из Railway
    const railwayVariables = await getRailwayEnvironmentVariables();
    
    if (!railwayVariables) {
      log('❌ Не удалось получить переменные окружения из Railway', 'error');
      return false;
    }
    
    // Чтение переменных окружения из .env
    const envPath = path.join(__dirname, '.env');
    
    if (!fs.existsSync(envPath)) {
      log('❌ Файл .env не найден', 'error');
      return false;
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    // Парсинг переменных окружения из .env
    const envVariables = {};
    
    for (const line of envLines) {
      if (line.trim() && !line.startsWith('#')) {
        const match = line.match(/^([^=]+)=(.*)$/);
        
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          
          if (key && value) {
            envVariables[key] = value;
          }
        }
      }
    }
    
    log(`✅ Получено ${Object.keys(envVariables).length} переменных окружения из .env`, 'success');
    
    // Список необходимых переменных окружения
    const requiredVariables = [
      'DATABASE_URL',
      'REDIS_URL',
      'TELEGRAM_BOT_TOKEN',
      'PORT',
      'RAILWAY_PUBLIC_URL',
      'NODE_ENV',
      'JWT_SECRET',
      'ADMIN_IDS',
      'WEBHOOK_URL',
      'CORS_ORIGIN',
      'S3_ACCESS_KEY',
      'S3_SECRET_KEY',
      'S3_REGION',
      'S3_BUCKET_NAME',
      'S3_BACKUP_BUCKET',
      'S3_ENDPOINT',
      'S3_UPLOAD_URL',
      'S3_BACKUP_URL',
      'METRICS_ENABLED'
    ];
    
    // Проверка наличия необходимых переменных окружения в Railway
    const missingVariables = [];
    
    for (const variable of requiredVariables) {
      if (!railwayVariables[variable]) {
        missingVariables.push(variable);
      }
    }
    
    if (missingVariables.length > 0) {
      log(`❌ Отсутствуют необходимые переменные окружения в Railway: ${missingVariables.join(', ')}`, 'error');
      
      // Установка отсутствующих переменных окружения
      for (const variable of missingVariables) {
        if (envVariables[variable]) {
          try {
            executeCommand(`railway variables set ${variable}=${envVariables[variable]}`);
            log(`✅ Установлена переменная окружения ${variable} в Railway`, 'success');
          } catch (error) {
            try {
              executeCommand(`railway.exe variables set ${variable}=${envVariables[variable]}`);
              log(`✅ Установлена переменная окружения ${variable} в Railway`, 'success');
            } catch (exeError) {
              log(`❌ Ошибка при установке переменной окружения ${variable} в Railway: ${error.message}`, 'error');
            }
          }
        } else {
          log(`❌ Переменная окружения ${variable} отсутствует в .env`, 'error');
        }
      }
    } else {
      log('✅ Все необходимые переменные окружения настроены в Railway', 'success');
    }
    
    // Проверка значений переменных окружения
    const incorrectVariables = [];
    
    for (const variable of requiredVariables) {
      if (railwayVariables[variable] && envVariables[variable] && railwayVariables[variable] !== envVariables[variable]) {
        incorrectVariables.push(variable);
      }
    }
    
    if (incorrectVariables.length > 0) {
      log(`⚠️ Значения переменных окружения в Railway отличаются от значений в .env: ${incorrectVariables.join(', ')}`, 'warning');
      
      // Запрос на обновление переменных окружения
      log('Хотите обновить значения переменных окружения в Railway? (y/n)', 'info');
      const answer = await new Promise(resolve => {
        process.stdin.once('data', data => {
          resolve(data.toString().trim().toLowerCase());
        });
      });
      
      if (answer === 'y' || answer === 'yes') {
        // Обновление переменных окружения
        for (const variable of incorrectVariables) {
          try {
            executeCommand(`railway variables set ${variable}=${envVariables[variable]}`);
            log(`✅ Обновлена переменная окружения ${variable} в Railway`, 'success');
          } catch (error) {
            try {
              executeCommand(`railway.exe variables set ${variable}=${envVariables[variable]}`);
              log(`✅ Обновлена переменная окружения ${variable} в Railway`, 'success');
            } catch (exeError) {
              log(`❌ Ошибка при обновлении переменной окружения ${variable} в Railway: ${error.message}`, 'error');
            }
          }
        }
      } else {
        log('⚠️ Обновление переменных окружения отменено', 'warning');
      }
    } else {
      log('✅ Значения переменных окружения в Railway соответствуют значениям в .env', 'success');
    }
    
    return true;
  } catch (error) {
    log(`❌ Ошибка при настройке переменных окружения в Railway: ${error.message}`, 'error');
    return false;
  }
}

// Главная функция
async function main() {
  log('=== ПРОВЕРКА И НАСТРОЙКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ В RAILWAY ===', 'title');
  
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
    
    // Выбор проекта в Railway
    const projectName = await selectRailwayProject();
    
    if (!projectName) {
      log('❌ Не удалось выбрать проект в Railway', 'error');
      return;
    }
    
    // Настройка переменных окружения в Railway
    const environmentVariablesSetup = await setupRailwayEnvironmentVariables();
    
    if (!environmentVariablesSetup) {
      log('❌ Не удалось настроить переменные окружения в Railway', 'error');
      return;
    }
    
    // Вывод итогового результата
    log('=== ИТОГОВЫЙ РЕЗУЛЬТАТ ===', 'title');
    log(`✅ Переменные окружения успешно настроены в Railway`, 'success');
    log(`✅ Проект Railway: ${projectName}`, 'success');
    
    log('', 'info');
    log('Для управления проектом в Railway выполните команду:', 'info');
    log('railway open', 'info');
    
    log('', 'info');
    log('Для проверки работоспособности API, откройте в браузере:', 'info');
    log(`https://web-production-73916.up.railway.app/api/health`, 'info');
    
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
