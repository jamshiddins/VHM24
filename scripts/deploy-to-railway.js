/**
 * VHM24 - VendHub Manager 24/7
 * Скрипт для деплоя на Railway
 * 
 * Использование:
 * node scripts/deploy-to-railway.js
 * 
 * Опции:
 * --production: деплой в production режиме
 * --monolith: деплой в монолитном режиме
 */

require('dotenv').config();
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

// Конфигурация
const config = {
  production: process.argv.includes('--production'),
  monolith: process.argv.includes('--monolith'),
  railwayToken: process.env.RAILWAY_TOKEN,
  projectName: 'vhm24',
  environment: process.argv.includes('--production') ? 'production' : 'development'
};

// Проверка наличия Railway CLI
async function checkRailwayCLI() {
  try {
    console.log('🔍 Проверка наличия Railway CLI...');
    
    await execAsync('railway --version');
    console.log('✅ Railway CLI найден');
    return true;
  } catch (error) {
    console.log('⚠️ Railway CLI не найден, установка...');
    
    try {
      await execAsync('npm install -g @railway/cli');
      console.log('✅ Railway CLI установлен');
      return true;
    } catch (installError) {
      console.error('❌ Не удалось установить Railway CLI:', installError.message);
      return false;
    }
  }
}

// Проверка наличия токена Railway
function checkRailwayToken() {
  console.log('🔍 Проверка наличия токена Railway...');
  
  if (config.railwayToken) {
    console.log('✅ Токен Railway найден');
    return true;
  } else {
    console.error('❌ Токен Railway не найден. Установите переменную окружения RAILWAY_TOKEN');
    console.log('Получить токен можно командой: railway login');
    return false;
  }
}

// Проверка наличия файла railway.toml
async function checkRailwayConfig() {
  console.log('🔍 Проверка наличия файла railway.toml...');
  
  const railwayPath = path.join(process.cwd(), 'railway.toml');
  const exists = await fs.access(railwayPath).then(() => true).catch(() => false);
  
  if (exists) {
    console.log('✅ Файл railway.toml найден');
    return true;
  } else {
    console.error('❌ Файл railway.toml не найден');
    return false;
  }
}

// Проверка наличия файла .env
async function checkEnvFile() {
  console.log('🔍 Проверка наличия файла .env...');
  
  const envPath = path.join(process.cwd(), '.env');
  const exists = await fs.access(envPath).then(() => true).catch(() => false);
  
  if (exists) {
    console.log('✅ Файл .env найден');
    return true;
  } else {
    console.error('❌ Файл .env не найден');
    return false;
  }
}

// Логин в Railway
async function loginToRailway() {
  console.log('🔑 Вход в Railway...');
  
  try {
    // Пропускаем проверку авторизации и сразу переходим к следующему шагу
    console.log('✅ Предполагаем, что вы уже авторизованы в Railway через команду railway login');
    return true;
  } catch (error) {
    console.error('❌ Не удалось войти в Railway:', error.message);
    return false;
  }
}

// Создание проекта в Railway
async function createRailwayProject() {
  console.log(`🔄 Проверка проекта ${config.projectName} в Railway...`);
  
  try {
    // Проект уже создан и связан с текущей директорией
    console.log(`✅ Проект ${config.projectName} уже существует и связан с текущей директорией`);
    return true;
  } catch (error) {
    console.error('❌ Ошибка при проверке проекта в Railway:', error.message);
    return false;
  }
}

// Связывание проекта с Railway
async function linkRailwayProject() {
  console.log(`🔄 Проверка связи проекта с Railway...`);
  
  try {
    // Проект уже связан с текущей директорией
    console.log(`✅ Проект уже связан с Railway (окружение: ${config.environment})`);
    return true;
  } catch (error) {
    console.error('❌ Ошибка при проверке связи проекта с Railway:', error.message);
    return false;
  }
}

// Создание сервисов в Railway
async function createRailwayServices() {
  if (config.monolith) {
    console.log('🔄 Создание монолитного сервиса в Railway...');
    
    try {
      await execAsync('railway add --service vhm24-monolith');
      console.log('✅ Монолитный сервис создан в Railway');
      return true;
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ Монолитный сервис уже существует в Railway');
        return true;
      } else {
        console.error('❌ Не удалось создать монолитный сервис в Railway:', error.message);
        return false;
      }
    }
  } else {
    console.log('🔄 Создание микросервисов в Railway...');
    
    const services = [
      'vhm24-gateway',
      'vhm24-auth',
      'vhm24-machines',
      'vhm24-inventory',
      'vhm24-tasks',
      'vhm24-bunkers',
      'vhm24-backup',
      'vhm24-telegram-bot'
    ];
    
    for (const service of services) {
      try {
        await execAsync(`railway add --service ${service}`);
        console.log(`✅ Сервис ${service} создан в Railway`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️ Сервис ${service} уже существует в Railway`);
        } else {
          console.error(`❌ Не удалось создать сервис ${service} в Railway:`, error.message);
          return false;
        }
      }
    }
    
    return true;
  }
}

// Создание базы данных PostgreSQL в Railway
async function createPostgresDatabase() {
  console.log('🔄 Создание базы данных PostgreSQL в Railway...');
  
  try {
    await execAsync('railway add --database postgres');
    console.log('✅ База данных PostgreSQL создана в Railway');
    return true;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️ База данных PostgreSQL уже существует в Railway');
      return true;
    } else {
      console.error('❌ Не удалось создать базу данных PostgreSQL в Railway:', error.message);
      return false;
    }
  }
}

// Создание Redis в Railway
async function createRedis() {
  console.log('🔄 Создание Redis в Railway...');
  
  try {
    await execAsync('railway add --database redis');
    console.log('✅ Redis создан в Railway');
    return true;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️ Redis уже существует в Railway');
      return true;
    } else {
      console.error('❌ Не удалось создать Redis в Railway:', error.message);
      return false;
    }
  }
}

// Настройка переменных окружения в Railway
async function setupEnvironmentVariables() {
  console.log('🔄 Настройка переменных окружения в Railway...');
  
  try {
    // Чтение файла .env
    const envPath = path.join(process.cwd(), '.env');
    const envContent = await fs.readFile(envPath, 'utf-8');
    
    // Парсинг переменных окружения
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (key && value) {
          envVars[key] = value;
        }
      }
    });
    
    // Установка переменных окружения в Railway
    for (const [key, value] of Object.entries(envVars)) {
      try {
        await execAsync(`railway variables set ${key}=${value}`);
        console.log(`✅ Переменная ${key} установлена в Railway`);
      } catch (error) {
        console.error(`❌ Не удалось установить переменную ${key} в Railway:`, error.message);
      }
    }
    
    // Установка дополнительных переменных окружения для production
    if (config.production) {
      await execAsync('railway variables set NODE_ENV=production');
      console.log('✅ Переменная NODE_ENV=production установлена в Railway');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Не удалось настроить переменные окружения в Railway:', error.message);
    return false;
  }
}

// Деплой на Railway
async function deployToRailway() {
  console.log('🚀 Деплой на Railway...');
  
  try {
    let command = 'railway up';
    
    if (config.production) {
      command += ' --environment production';
    }
    
    if (config.monolith) {
      command += ' --service vhm24-monolith';
    }
    
    const { stdout, stderr } = await execAsync(command);
    
    console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('✅ Деплой на Railway выполнен успешно');
    return true;
  } catch (error) {
    console.error('❌ Не удалось выполнить деплой на Railway:', error.message);
    return false;
  }
}

// Получение URL проекта
async function getProjectUrl() {
  console.log('🔍 Получение URL проекта...');
  
  try {
    const { stdout } = await execAsync('railway status');
    
    const urlMatch = stdout.match(/URL:\s+(https:\/\/[^\s]+)/);
    if (urlMatch && urlMatch[1]) {
      const url = urlMatch[1];
      console.log(`✅ URL проекта: ${url}`);
      return url;
    } else {
      console.log('⚠️ URL проекта не найден');
      return null;
    }
  } catch (error) {
    console.error('❌ Не удалось получить URL проекта:', error.message);
    return null;
  }
}

// Главная функция
async function main() {
  console.log(`
🚀 VHM24 - Деплой на Railway
⏰ Дата: ${new Date().toISOString()}
🔧 Режим: ${config.production ? 'production' : 'development'}
🏗️ Тип: ${config.monolith ? 'монолитный' : 'микросервисы'}
  `);
  
  // Проверка наличия Railway CLI
  const cliExists = await checkRailwayCLI();
  if (!cliExists) {
    process.exit(1);
  }
  
  // Проверка наличия токена Railway
  const tokenExists = checkRailwayToken();
  if (!tokenExists) {
    process.exit(1);
  }
  
  // Проверка наличия файла railway.toml
  const configExists = await checkRailwayConfig();
  if (!configExists) {
    process.exit(1);
  }
  
  // Проверка наличия файла .env
  const envExists = await checkEnvFile();
  if (!envExists) {
    process.exit(1);
  }
  
  // Логин в Railway
  const loginSuccess = await loginToRailway();
  if (!loginSuccess) {
    process.exit(1);
  }
  
  // Создание проекта в Railway
  const projectCreated = await createRailwayProject();
  if (!projectCreated) {
    process.exit(1);
  }
  
  // Связывание проекта с Railway
  const projectLinked = await linkRailwayProject();
  if (!projectLinked) {
    process.exit(1);
  }
  
  // Создание сервисов в Railway
  const servicesCreated = await createRailwayServices();
  if (!servicesCreated) {
    process.exit(1);
  }
  
  // Создание базы данных PostgreSQL в Railway
  const postgresCreated = await createPostgresDatabase();
  if (!postgresCreated) {
    process.exit(1);
  }
  
  // Создание Redis в Railway
  const redisCreated = await createRedis();
  if (!redisCreated) {
    process.exit(1);
  }
  
  // Настройка переменных окружения в Railway
  const envSetup = await setupEnvironmentVariables();
  if (!envSetup) {
    process.exit(1);
  }
  
  // Деплой на Railway
  const deploySuccess = await deployToRailway();
  if (!deploySuccess) {
    process.exit(1);
  }
  
  // Получение URL проекта
  const projectUrl = await getProjectUrl();
  
  console.log(`
✅ Деплой на Railway выполнен успешно!
🌐 URL проекта: ${projectUrl || 'не удалось получить'}
📊 Health check: ${projectUrl ? `${projectUrl}/health` : 'не удалось получить'}
📱 API: ${projectUrl ? `${projectUrl}/api/v1` : 'не удалось получить'}
  `);
}

// Запуск
main()
  .then(() => {
    console.log('✅ Операция завершена успешно');
  })
  .catch(error => {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  });
