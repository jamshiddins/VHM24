/**
 * Скрипт для извлечения переменных окружения из Railway
 * Запускается командой: node extract-railway-variables.js
 */

const { execSync } = require('child_process');

// Цвета для вывода в консоль
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Функция для логирования с цветом
function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

// Функция для проверки наличия Railway CLI
function checkRailwayCLI() {
  try {
    // Проверяем, работаем ли мы на Windows
    const isWindows = process.platform === 'win32';
    
    // Формируем команду с учетом особенностей Windows
    const command = isWindows 
      ? 'where railway >nul 2>&1'
      : 'which railway >/dev/null 2>&1';
    
    execSync(command);
    
    // Проверяем версию Railway CLI
    execSync('railway --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    log('❌ Railway CLI не установлен. Установите его с помощью команды: npm install -g @railway/cli', 'red');
    return false;
  }
}

// Функция для проверки авторизации в Railway
function checkRailwayAuth() {
  try {
    execSync('railway whoami', { stdio: 'ignore' });
    return true;
  } catch (error) {
    log('❌ Вы не авторизованы в Railway. Авторизуйтесь с помощью команды: railway login', 'red');
    return false;
  }
}

// Функция для получения переменных окружения из Railway
function getRailwayVariables() {
  try {
    // Получаем справку по команде railway variables, чтобы определить доступные опции
    const helpOutput = execSync('railway variables --help').toString();
    
    // Проверяем, поддерживается ли опция --service
    const supportsService = helpOutput.includes('--service');
    
    // Проверяем, поддерживается ли опция --json
    const supportsJson = helpOutput.includes('--json');
    
    // Формируем команду в зависимости от поддерживаемых опций
    let command = 'railway variables';
    
    if (supportsService) {
      command += ' --service web';
    }
    
    if (supportsJson) {
      command += ' --json';
    }
    
    log(`Выполняем команду: ${command}`, 'blue');
    
    // Выполняем команду
    const output = execSync(command).toString();
    
    // Если вывод в формате JSON, парсим его
    if (supportsJson) {
      const variables = JSON.parse(output);
      
      // Если это массив объектов с полями name и value
      if (Array.isArray(variables) && variables.length > 0 && variables[0].name && variables[0].value) {
        const result = {};
        for (const variable of variables) {
          result[variable.name] = variable.value;
        }
        return result;
      }
      
      // Если это объект с ключами и значениями
      return variables;
    }
    
    // Если вывод не в формате JSON, парсим его вручную
    // Предполагаем, что вывод имеет формат "KEY=VALUE" для каждой строки
    const result = {};
    const lines = output.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        const value = valueParts.join('=');
        if (key && value) {
          result[key.trim()] = value.trim();
        }
      }
    }
    
    return result;
  } catch (error) {
    log('❌ Ошибка при получении переменных окружения из Railway:', 'red');
    log(error.message, 'red');
    
    // Пробуем альтернативный подход - использовать railway run для выполнения команды env
    try {
      log('Пробуем альтернативный подход - использовать railway run...', 'yellow');
      const output = execSync('railway run env').toString();
      
      const result = {};
      const lines = output.split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          const value = valueParts.join('=');
          if (key && value) {
            result[key.trim()] = value.trim();
          }
        }
      }
      
      return result;
    } catch (fallbackError) {
      log('❌ Не удалось получить переменные окружения через railway run:', 'red');
      log(fallbackError.message, 'red');
      
      // Пробуем еще один альтернативный подход - использовать railway link и затем railway variables
      try {
        log('Пробуем еще один альтернативный подход - использовать railway link...', 'yellow');
        
        // Получаем список проектов
        const projectsOutput = execSync('railway project list').toString();
        const projectLines = projectsOutput.split('\n');
        
        // Находим строку с текущим проектом (обычно помечен звездочкой)
        const currentProjectLine = projectLines.find(line => line.includes('*'));
        
        if (currentProjectLine) {
          // Извлекаем ID проекта
          const projectId = currentProjectLine.split(' ')[0];
          
          // Линкуем проект
          execSync(`railway link --project ${projectId}`);
          
          // Теперь пробуем получить переменные
          const varsOutput = execSync('railway variables').toString();
          
          const result = {};
          const lines = varsOutput.split('\n');
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
              const [key, ...valueParts] = trimmedLine.split('=');
              const value = valueParts.join('=');
              if (key && value) {
                result[key.trim()] = value.trim();
              }
            }
          }
          
          return result;
        }
      } catch (linkError) {
        log('❌ Не удалось получить переменные окружения через railway link:', 'red');
        log(linkError.message, 'red');
      }
      
      return {};
    }
  }
}

// Функция для форматирования переменных окружения в виде .env файла
function formatEnvVariables(variables) {
  // Группируем переменные по категориям
  const categories = {
    'Database': ['DATABASE_URL'],
    'Authentication': ['JWT_SECRET'],
    'API Configuration': ['API_URL', 'PORT', 'NODE_ENV'],
    'Railway Integration': ['RAILWAY_PUBLIC_URL', 'RAILWAY_PUBLIC_DOMAIN'],
    'Telegram Bot': ['TELEGRAM_BOT_TOKEN', 'ADMIN_IDS', 'WEBHOOK_URL'],
    'Redis': ['REDIS_URL'],
    'File Storage': ['S3_ACCESS_KEY', 'S3_SECRET_KEY', 'S3_BUCKET', 'S3_ENDPOINT', 'S3_REGION', 'S3_BACKUP_BUCKET', 'UPLOADS_ENDPOINT', 'BACKUPS_ENDPOINT'],
    'CORS': ['CORS_ORIGIN'],
    'Logging': ['LOG_LEVEL'],
    'Payment Systems': ['MULTIKASSA_API_URL', 'MULTIKASSA_API_KEY', 'PAYME_API_URL', 'PAYME_API_KEY'],
    'Monitoring': ['METRICS_ENABLED'],
    'Other': []
  };
  
  // Формируем содержимое файла .env
  let content = '# VHM24 Environment Variables\n';
  content += `# Извлечено из Railway: ${new Date().toISOString()}\n\n`;
  
  // Добавляем переменные по категориям
  for (const [category, keys] of Object.entries(categories)) {
    // Проверяем, есть ли переменные в этой категории
    const categoryVars = keys.filter(key => variables[key]);
    
    // Добавляем переменные, которые не попали ни в одну категорию
    if (category === 'Other') {
      const otherVars = Object.keys(variables).filter(key => {
        return !Object.values(categories).flat().includes(key);
      });
      
      if (otherVars.length > 0) {
        content += `# ${category}\n`;
        
        for (const key of otherVars) {
          content += `${key}=${variables[key]}\n`;
        }
        
        content += '\n';
      }
      
      continue;
    }
    
    if (categoryVars.length > 0) {
      content += `# ${category}\n`;
      
      for (const key of categoryVars) {
        content += `${key}=${variables[key]}\n`;
      }
      
      content += '\n';
    }
  }
  
  return content;
}

// Функция для вывода переменных окружения в консоль
function printEnvVariables(variables) {
  const content = formatEnvVariables(variables);
  console.log(content);
}

// Основная функция
function main() {
  log('🔍 Извлечение переменных окружения из Railway...', 'blue');
  
  // Проверка наличия Railway CLI и авторизации
  if (!checkRailwayCLI() || !checkRailwayAuth()) {
    return;
  }
  
  // Получение переменных окружения из Railway
  const variables = getRailwayVariables();
  
  if (Object.keys(variables).length === 0) {
    log('❌ Не удалось получить переменные окружения из Railway', 'red');
    return;
  }
  
  log(`✅ Получено ${Object.keys(variables).length} переменных окружения из Railway`, 'green');
  
  // Вывод переменных окружения в консоль
  printEnvVariables(variables);
  
  log('✅ Извлечение переменных окружения из Railway завершено', 'green');
}

// Запуск основной функции
main();
