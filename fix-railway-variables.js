#!/usr/bin/env node
/**
 * Скрипт для исправления переменных окружения в Railway
 * Запускается командой: node fix-railway-variables.js
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

// Функция для получения переменных окружения из Railway
async function getRailwayVariables() {
  try {
    // Получение переменных окружения из Railway
    const variables = executeCommand('railway variables');
    
    if (!variables) {
      log('❌ Не удалось получить переменные окружения из Railway', 'error');
      return null;
    }
    
    // Парсинг переменных окружения
    const variablesMap = {};
    const lines = variables.split('\n');
    
    for (const line of lines) {
      if (line.trim()) {
        const [key, value] = line.split('=');
        if (key && value) {
          variablesMap[key.trim()] = value.trim();
        }
      }
    }
    
    return variablesMap;
  } catch (error) {
    log(`❌ Ошибка при получении переменных окружения из Railway: ${error.message}`, 'error');
    return null;
  }
}

// Функция для получения информации о плагинах
async function getPlugins() {
  try {
    // Получение информации о плагинах
    const plugins = executeCommand('railway service list');
    
    if (!plugins) {
      log('❌ Не удалось получить информацию о плагинах', 'error');
      return null;
    }
    
    return plugins;
  } catch (error) {
    log(`❌ Ошибка при получении информации о плагинах: ${error.message}`, 'error');
    return null;
  }
}

// Функция для получения информации о PostgreSQL
async function getPostgresInfo() {
  try {
    // Получение информации о PostgreSQL
    const postgresInfo = executeCommand('railway service show postgresql');
    
    if (!postgresInfo) {
      log('❌ Не удалось получить информацию о PostgreSQL', 'error');
      return null;
    }
    
    return postgresInfo;
  } catch (error) {
    log(`❌ Ошибка при получении информации о PostgreSQL: ${error.message}`, 'error');
    return null;
  }
}

// Функция для получения информации о Redis
async function getRedisInfo() {
  try {
    // Получение информации о Redis
    const redisInfo = executeCommand('railway service show redis');
    
    if (!redisInfo) {
      log('❌ Не удалось получить информацию о Redis', 'error');
      return null;
    }
    
    return redisInfo;
  } catch (error) {
    log(`❌ Ошибка при получении информации о Redis: ${error.message}`, 'error');
    return null;
  }
}

// Функция для установки переменной окружения в Railway
async function setRailwayVariable(key, value) {
  try {
    // Установка переменной окружения в Railway
    executeCommand(`railway variables set ${key} ${value}`);
    
    log(`✅ Переменная ${key} успешно установлена`, 'success');
    return true;
  } catch (error) {
    log(`❌ Ошибка при установке переменной ${key}: ${error.message}`, 'error');
    return false;
  }
}

// Функция для создания PostgreSQL
async function createPostgres() {
  try {
    // Создание PostgreSQL
    executeCommand('railway add');
    
    log('✅ PostgreSQL успешно создан', 'success');
    return true;
  } catch (error) {
    log(`❌ Ошибка при создании PostgreSQL: ${error.message}`, 'error');
    return false;
  }
}

// Функция для создания Redis
async function createRedis() {
  try {
    // Создание Redis
    executeCommand('railway add');
    
    log('✅ Redis успешно создан', 'success');
    return true;
  } catch (error) {
    log(`❌ Ошибка при создании Redis: ${error.message}`, 'error');
    return false;
  }
}

// Функция для исправления переменных окружения
async function fixEnvironmentVariables() {
  try {
    // Получение переменных окружения из Railway
    const variables = await getRailwayVariables();
    
    if (!variables) {
      log('❌ Не удалось получить переменные окружения из Railway', 'error');
      return false;
    }
    
    // Получение информации о плагинах
    const plugins = await getPlugins();
    
    if (!plugins) {
      log('❌ Не удалось получить информацию о плагинах', 'error');
      return false;
    }
    
    // Проверка наличия PostgreSQL
    if (!plugins.includes('postgresql')) {
      log('❌ PostgreSQL не установлен', 'error');
      
      // Запрос у пользователя, хочет ли он создать PostgreSQL
      await new Promise((resolve) => {
        rl.question('Хотите создать PostgreSQL? (y/n): ', async (answer) => {
          if (answer.toLowerCase() === 'y') {
            const postgresCreated = await createPostgres();
            
            if (!postgresCreated) {
              log('❌ Не удалось создать PostgreSQL', 'error');
              resolve(false);
              return;
            }
          } else {
            log('Создание PostgreSQL отменено', 'warning');
            resolve(false);
            return;
          }
          
          resolve(true);
        });
      });
    }
    
    // Проверка наличия Redis
    if (!plugins.includes('redis')) {
      log('❌ Redis не установлен', 'error');
      
      // Запрос у пользователя, хочет ли он создать Redis
      await new Promise((resolve) => {
        rl.question('Хотите создать Redis? (y/n): ', async (answer) => {
          if (answer.toLowerCase() === 'y') {
            const redisCreated = await createRedis();
            
            if (!redisCreated) {
              log('❌ Не удалось создать Redis', 'error');
              resolve(false);
              return;
            }
          } else {
            log('Создание Redis отменено', 'warning');
            resolve(false);
            return;
          }
          
          resolve(true);
        });
      });
    }
    
    // Получение информации о PostgreSQL
    const postgresInfo = await getPostgresInfo();
    
    if (postgresInfo) {
      // Парсинг информации о PostgreSQL
      const postgresUrlMatch = postgresInfo.match(/DATABASE_URL=([^\s]+)/);
      
      if (postgresUrlMatch && postgresUrlMatch[1]) {
        const postgresUrl = postgresUrlMatch[1];
        
        // Проверка наличия переменной DATABASE_URL
        if (!variables.DATABASE_URL || variables.DATABASE_URL !== postgresUrl) {
          log(`⚠️ Переменная DATABASE_URL не установлена или имеет неправильное значение`, 'warning');
          
          // Установка переменной DATABASE_URL
          await setRailwayVariable('DATABASE_URL', postgresUrl);
        } else {
          log('✅ Переменная DATABASE_URL установлена корректно', 'success');
        }
      } else {
        log('❌ Не удалось получить URL PostgreSQL', 'error');
      }
    }
    
    // Получение информации о Redis
    const redisInfo = await getRedisInfo();
    
    if (redisInfo) {
      // Парсинг информации о Redis
      const redisUrlMatch = redisInfo.match(/REDIS_URL=([^\s]+)/);
      
      if (redisUrlMatch && redisUrlMatch[1]) {
        const redisUrl = redisUrlMatch[1];
        
        // Проверка наличия переменной REDIS_URL
        if (!variables.REDIS_URL || variables.REDIS_URL !== redisUrl) {
          log(`⚠️ Переменная REDIS_URL не установлена или имеет неправильное значение`, 'warning');
          
          // Установка переменной REDIS_URL
          await setRailwayVariable('REDIS_URL', redisUrl);
        } else {
          log('✅ Переменная REDIS_URL установлена корректно', 'success');
        }
        
        // Парсинг REDIS_URL для получения хоста, порта и пароля
        const redisUrlObj = new URL(redisUrl);
        const redisHost = redisUrlObj.hostname;
        const redisPort = redisUrlObj.port || '6379';
        const redisPassword = redisUrlObj.password || '';
        
        // Проверка наличия переменной REDIS_HOST
        if (!variables.REDIS_HOST || variables.REDIS_HOST !== redisHost) {
          log(`⚠️ Переменная REDIS_HOST не установлена или имеет неправильное значение`, 'warning');
          
          // Установка переменной REDIS_HOST
          await setRailwayVariable('REDIS_HOST', redisHost);
        } else {
          log('✅ Переменная REDIS_HOST установлена корректно', 'success');
        }
        
        // Проверка наличия переменной REDIS_PORT
        if (!variables.REDIS_PORT || variables.REDIS_PORT !== redisPort) {
          log(`⚠️ Переменная REDIS_PORT не установлена или имеет неправильное значение`, 'warning');
          
          // Установка переменной REDIS_PORT
          await setRailwayVariable('REDIS_PORT', redisPort);
        } else {
          log('✅ Переменная REDIS_PORT установлена корректно', 'success');
        }
        
        // Проверка наличия переменной REDIS_PASSWORD
        if (redisPassword && (!variables.REDIS_PASSWORD || variables.REDIS_PASSWORD !== redisPassword)) {
          log(`⚠️ Переменная REDIS_PASSWORD не установлена или имеет неправильное значение`, 'warning');
          
          // Установка переменной REDIS_PASSWORD
          await setRailwayVariable('REDIS_PASSWORD', redisPassword);
        } else if (redisPassword) {
          log('✅ Переменная REDIS_PASSWORD установлена корректно', 'success');
        }
      } else {
        log('❌ Не удалось получить URL Redis', 'error');
      }
    }
    
    // Проверка наличия переменной JWT_SECRET
    if (!variables.JWT_SECRET) {
      log('⚠️ Переменная JWT_SECRET не установлена', 'warning');
      
      // Генерация JWT_SECRET
      const jwtSecret = require('crypto').randomBytes(32).toString('hex');
      
      // Установка переменной JWT_SECRET
      await setRailwayVariable('JWT_SECRET', jwtSecret);
    } else {
      log('✅ Переменная JWT_SECRET установлена', 'success');
    }
    
    // Проверка наличия переменной JWT_EXPIRES_IN
    if (!variables.JWT_EXPIRES_IN) {
      log('⚠️ Переменная JWT_EXPIRES_IN не установлена', 'warning');
      
      // Установка переменной JWT_EXPIRES_IN
      await setRailwayVariable('JWT_EXPIRES_IN', '7d');
    } else {
      log('✅ Переменная JWT_EXPIRES_IN установлена', 'success');
    }
    
    // Проверка наличия переменной PORT
    if (!variables.PORT) {
      log('⚠️ Переменная PORT не установлена', 'warning');
      
      // Установка переменной PORT
      await setRailwayVariable('PORT', '3000');
    } else {
      log('✅ Переменная PORT установлена', 'success');
    }
    
    // Проверка наличия переменной HOST
    if (!variables.HOST) {
      log('⚠️ Переменная HOST не установлена', 'warning');
      
      // Установка переменной HOST
      await setRailwayVariable('HOST', '0.0.0.0');
    } else {
      log('✅ Переменная HOST установлена', 'success');
    }
    
    // Проверка наличия переменной NODE_ENV
    if (!variables.NODE_ENV) {
      log('⚠️ Переменная NODE_ENV не установлена', 'warning');
      
      // Установка переменной NODE_ENV
      await setRailwayVariable('NODE_ENV', 'production');
    } else {
      log('✅ Переменная NODE_ENV установлена', 'success');
    }
    
    // Проверка наличия переменной RAILWAY_PUBLIC_URL
    if (!variables.RAILWAY_PUBLIC_URL) {
      log('⚠️ Переменная RAILWAY_PUBLIC_URL не установлена', 'warning');
      
      // Получение URL приложения
      const appUrl = executeCommand('railway service');
      const urlMatch = appUrl.match(/https:\/\/[^\s]+/);
      
      if (urlMatch && urlMatch[0]) {
        // Установка переменной RAILWAY_PUBLIC_URL
        await setRailwayVariable('RAILWAY_PUBLIC_URL', urlMatch[0]);
      } else {
        log('❌ Не удалось получить URL приложения', 'error');
      }
    } else {
      log('✅ Переменная RAILWAY_PUBLIC_URL установлена', 'success');
    }
    
    // Проверка наличия переменной RAILWAY_PUBLIC_DOMAIN
    if (!variables.RAILWAY_PUBLIC_DOMAIN) {
      log('⚠️ Переменная RAILWAY_PUBLIC_DOMAIN не установлена', 'warning');
      
      // Получение URL приложения
      const appUrl = executeCommand('railway service');
      const urlMatch = appUrl.match(/https:\/\/([^\s]+)/);
      
      if (urlMatch && urlMatch[1]) {
        // Установка переменной RAILWAY_PUBLIC_DOMAIN
        await setRailwayVariable('RAILWAY_PUBLIC_DOMAIN', urlMatch[1]);
      } else {
        log('❌ Не удалось получить домен приложения', 'error');
      }
    } else {
      log('✅ Переменная RAILWAY_PUBLIC_DOMAIN установлена', 'success');
    }
    
    // Проверка наличия переменной WEBHOOK_URL
    if (!variables.WEBHOOK_URL) {
      log('⚠️ Переменная WEBHOOK_URL не установлена', 'warning');
      
      // Получение URL приложения
      const appUrl = executeCommand('railway service');
      const urlMatch = appUrl.match(/https:\/\/([^\s]+)/);
      
      if (urlMatch && urlMatch[0]) {
        // Установка переменной WEBHOOK_URL
        await setRailwayVariable('WEBHOOK_URL', `${urlMatch[0]}/api/telegram/webhook`);
      } else {
        log('❌ Не удалось получить URL приложения', 'error');
      }
    } else {
      log('✅ Переменная WEBHOOK_URL установлена', 'success');
    }
    
    // Проверка наличия переменной API_BASE_URL
    if (!variables.API_BASE_URL) {
      log('⚠️ Переменная API_BASE_URL не установлена', 'warning');
      
      // Получение URL приложения
      const appUrl = executeCommand('railway service');
      const urlMatch = appUrl.match(/https:\/\/([^\s]+)/);
      
      if (urlMatch && urlMatch[0]) {
        // Установка переменной API_BASE_URL
        await setRailwayVariable('API_BASE_URL', `${urlMatch[0]}/api`);
      } else {
        log('❌ Не удалось получить URL приложения', 'error');
      }
    } else {
      log('✅ Переменная API_BASE_URL установлена', 'success');
    }
    
    return true;
  } catch (error) {
    log(`❌ Ошибка при исправлении переменных окружения: ${error.message}`, 'error');
    return false;
  }
}

// Главная функция
async function main() {
  log('=== ИСПРАВЛЕНИЕ ПЕРЕМЕННЫХ ОКРУЖЕНИЯ В RAILWAY ===', 'title');
  
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
    
    // Исправление переменных окружения
    const environmentVariablesFixed = await fixEnvironmentVariables();
    
    if (!environmentVariablesFixed) {
      log('❌ Не удалось исправить переменные окружения', 'error');
      rl.close();
      return;
    }
    
    // Вывод итогового результата
    log('=== ИТОГОВЫЙ РЕЗУЛЬТАТ ===', 'title');
    log('✅ Переменные окружения успешно исправлены', 'success');
    
    log('', 'info');
    log('Для перезапуска сервисов выполните команду:', 'info');
    log('railway up', 'info');
    
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
