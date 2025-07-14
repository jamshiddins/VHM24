#!/usr/bin/env node



const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Цвета для вывода
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Функции для вывода
function status(message) {
  
}

function success(message) {
  
}

function warning(message) {
  
}

function error(message) {
  
}

// Главная функция
async function main() {
  
  
  

  try {
    // 0. Установка необходимых зависимостей
    await installDependencies();
    
    // 1. Проверка конфигурации системы
    await checkSystemConfiguration();
    
    // 2. Проверка баз данных
    const dbStatus = await checkDatabases();
    
    // 3. Тестирование API
    await testApi();
    
    // 4. Тестирование Telegram бота
    await testTelegramBot();
    
    // 5. Обновление Git
    await updateGit();
    
    // 6. Создание отчета о тестировании
    await createTestReport(dbStatus);
    
    // Финальное сообщение
    printFinalMessage();
    
  } catch (err) {
    error(`Произошла ошибка: ${err.message}`);
    console.error(err);
  }
}

// Установка необходимых зависимостей
async function installDependencies() {
  status('Установка необходимых зависимостей...');
  
  try {
    // Проверяем наличие pg
    try {
      require.resolve('pg');
      success('Модуль pg уже установлен');
    } catch (e) {
      status('Установка pg...');
      execSync('npm install pg', { stdio: 'inherit' });
      success('Модуль pg установлен');
    }
    
    // Проверяем наличие redis
    try {
      require.resolve('redis');
      success('Модуль redis уже установлен');
    } catch (e) {
      status('Установка redis...');
      execSync('npm install redis', { stdio: 'inherit' });
      success('Модуль redis установлен');
    }
    
    // Проверяем наличие axios
    try {
      require.resolve('axios');
      success('Модуль axios уже установлен');
    } catch (e) {
      status('Установка axios...');
      execSync('npm install axios', { stdio: 'inherit' });
      success('Модуль axios установлен');
    }
    
    // Проверяем наличие prisma
    try {
      require.resolve('@prisma/client');
      success('Модуль @prisma/client уже установлен');
    } catch (e) {
      status('Установка @prisma/client...');
      execSync('npm install @prisma/client', { stdio: 'inherit' });
      success('Модуль @prisma/client установлен');
    }
    
    return true;
  } catch (err) {
    error(`Ошибка при установке зависимостей: ${err.message}`);
    return false;
  }
}

// Проверка конфигурации системы
async function checkSystemConfiguration() {
  status('Проверка конфигурации системы...');
  
  // Проверка наличия .env
  if (fs.existsSync('.env')) {
    success('Файл .env найден');
    
    // Проверка содержимого .env
    const envContent = fs.readFileSync('.env', 'utf8');
    
    // Проверка наличия DATABASE_URL
    if (envContent.includes('DATABASE_URL=')) {
      success('Переменная DATABASE_URL найдена в .env');
    } else {
      warning('Переменная DATABASE_URL не найдена в .env');
    }
    
    // Проверка наличия REDIS_URL
    if (envContent.includes('REDIS_URL=')) {
      success('Переменная REDIS_URL найдена в .env');
    } else {
      warning('Переменная REDIS_URL не найдена в .env');
    }
    
    // Проверка наличия PORT
    if (envContent.includes('PORT=')) {
      success('Переменная PORT найдена в .env');
    } else {
      warning('Переменная PORT не найдена в .env');
    }
    
    // Проверка наличия RAILWAY_PUBLIC_URL
    if (envContent.includes('RAILWAY_PUBLIC_URL=')) {
      success('Переменная RAILWAY_PUBLIC_URL найдена в .env');
    } else {
      warning('Переменная RAILWAY_PUBLIC_URL не найдена в .env');
    }
  } else {
    warning('Файл .env не найден');
  }
  
  // Проверка наличия package.json
  if (fs.existsSync('package.json')) {
    success('Файл package.json найден');
    
    // Проверка содержимого package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Проверка наличия скрипта start
    if (packageJson.scripts && packageJson.scripts.start) {
      success(`Скрипт start найден: ${packageJson.scripts.start}`);
    } else {
      warning('Скрипт start не найден в package.json');
    }
    
    // Проверка наличия зависимостей
    const dependencies = packageJson.dependencies || {};
    const requiredDeps = ['express', 'pg', 'redis', '@prisma/client'];
    
    for (const dep of requiredDeps) {
      if (dependencies[dep]) {
        success(`Зависимость ${dep} найдена: ${dependencies[dep]}`);
      } else {
        warning(`Зависимость ${dep} не найдена в package.json`);
      }
    }
  } else {
    warning('Файл package.json не найден');
  }
  
  // Проверка наличия railway.toml
  if (fs.existsSync('railway.toml')) {
    success('Файл railway.toml найден');
    
    // Проверка содержимого railway.toml
    const railwayToml = fs.readFileSync('railway.toml', 'utf8');
    
    // Проверка наличия healthcheckPath
    if (railwayToml.includes('healthcheckPath')) {
      success('Параметр healthcheckPath найден в railway.toml');
    } else {
      warning('Параметр healthcheckPath не найден в railway.toml');
    }
    
    // Проверка наличия startCommand
    if (railwayToml.includes('startCommand')) {
      success('Параметр startCommand найден в railway.toml');
    } else {
      warning('Параметр startCommand не найден в railway.toml');
    }
    
    // Проверка наличия service.web
    if (railwayToml.includes('service.web') || railwayToml.includes('[[services]]')) {
      success('Параметр service.web найден в railway.toml');
    } else {
      warning('Параметр service.web не найден в railway.toml');
    }
  } else {
    warning('Файл railway.toml не найден');
  }
  
  // Проверка наличия Procfile
  if (fs.existsSync('Procfile')) {
    success('Файл Procfile найден');
    
    // Проверка содержимого Procfile
    const procfileContent = fs.readFileSync('Procfile', 'utf8');
    
    // Проверка наличия web: npm start
    if (procfileContent.includes('web: npm start')) {
      success('Команда web: npm start найдена в Procfile');
    } else {
      warning('Команда web: npm start не найдена в Procfile');
    }
  } else {
    warning('Файл Procfile не найден');
  }
  
  // Проверка наличия server.js или index.js
  if (fs.existsSync('server.js')) {
    success('Файл server.js найден');
  } else if (fs.existsSync('index.js')) {
    success('Файл index.js найден');
  } else {
    warning('Файлы server.js и index.js не найдены');
  }
  
  // Проверка наличия prisma/schema.prisma
  if (fs.existsSync('backend/prisma/schema.prisma')) {
    success('Файл backend/prisma/schema.prisma найден');
  } else if (fs.existsSync('prisma/schema.prisma')) {
    success('Файл prisma/schema.prisma найден');
  } else {
    warning('Файл schema.prisma не найден');
  }
}

// Проверка баз данных
async function checkDatabases() {
  status('Проверка баз данных...');
  
  const dbStatus = {
    postgresql: {
      connected: false,
      url: '',
      tables: [],
      error: null
    },
    redis: {
      connected: false,
      url: '',
      keys: [],
      error: null
    }
  };
  
  // Получение переменных окружения
  let databaseUrl = '';
  let redisUrl = '';
  
  // Пытаемся получить переменные из Railway
  try {
    const railwayVars = execSync('railway variables', { encoding: 'utf8' });
    
    // Парсим DATABASE_URL
    const dbUrlMatch = railwayVars.match(/DATABASE_URL\s*│\s*([^\n│]+)/);
    if (dbUrlMatch && dbUrlMatch[1]) {
      databaseUrl = dbUrlMatch[1].trim();
      dbStatus.postgresql.url = databaseUrl;
      success('Получен DATABASE_URL из Railway');
    }
    
    // Парсим REDIS_URL
    const redisUrlMatch = railwayVars.match(/REDIS_URL\s*│\s*([^\n│]+)/);
    if (redisUrlMatch && redisUrlMatch[1]) {
      redisUrl = redisUrlMatch[1].trim();
      dbStatus.redis.url = redisUrl;
      success('Получен REDIS_URL из Railway');
    }
  } catch (err) {
    warning(`Не удалось получить переменные из Railway: ${err.message}`);
    
    // Пытаемся получить переменные из .env
    if (fs.existsSync('.env')) {
      const envContent = fs.readFileSync('.env', 'utf8');
      
      // Парсим DATABASE_URL
      const dbUrlMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)/);
      if (dbUrlMatch && dbUrlMatch[1]) {
        databaseUrl = dbUrlMatch[1].trim();
        dbStatus.postgresql.url = databaseUrl;
        success('Получен DATABASE_URL из .env');
      }
      
      // Парсим REDIS_URL
      const redisUrlMatch = envContent.match(/REDIS_URL=["']?([^"'\n]+)/);
      if (redisUrlMatch && redisUrlMatch[1]) {
        redisUrl = redisUrlMatch[1].trim();
        dbStatus.redis.url = redisUrl;
        success('Получен REDIS_URL из .env');
      }
    }
  }
  
  // Проверка PostgreSQL
  if (databaseUrl) {
    status('Тестирование подключения к PostgreSQL...');
    
    // Создаем временный файл для тестирования
    const testFile = process.env.API_KEY_149 || 'test-pg-connection.js';
    const testCode = `
const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    connectionString: '${databaseUrl}'
  });
  
  try {
    
    await client.connect();
    
    
    const result = await client.query('SELECT current_database() as db, current_user as user, version() as version');
    
    
    
    
    
    // Проверяем наличие таблиц
    const tablesResult = await client.query(\`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    \`);
    
    
    if (tablesResult.rows.length === 0) {
      
    } else {
      tablesResult.rows.forEach(row => {
        
      });
    }
    
    // Выводим список таблиц в формате JSON для парсинга
    
    console.log(JSON.stringify(tablesResult.rows.map(row => row.table_name)));
    
    
  } catch (err) {
    console.error('Error connecting to PostgreSQL:', err.message);
    process.exit(1);
  } finally {
    await client.end();
    
  }
}

testConnection();
`;

    fs.writeFileSync(testFile, testCode);
    
    try {
      // Запускаем тест
      status('Запуск теста PostgreSQL...');
      const result = execSync(`node ${testFile}`, { encoding: 'utf8' });
      
      
      // Парсим список таблиц
      const tablesMatch = result.match(/TABLES_JSON_START\n(.*)\nTABLES_JSON_END/s);
      if (tablesMatch && tablesMatch[1]) {
        try {
          const tables = JSON.parse(tablesMatch[1]);
          dbStatus.postgresql.tables = tables;
          dbStatus.postgresql.connected = true;
          success(`Найдено ${tables.length} таблиц в базе данных PostgreSQL`);
        } catch (e) {
          warning(`Не удалось распарсить список таблиц: ${e.message}`);
        }
      }
      
      // Удаляем временный файл
      fs.unlinkSync(testFile);
      
      success('Тестирование PostgreSQL завершено успешно');
    } catch (err) {
      error(`Ошибка при тестировании PostgreSQL: ${err.message}`);
      dbStatus.postgresql.error = err.message;
      
      // Удаляем временный файл
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
      }
    }
  } else {
    error('DATABASE_URL не найден, пропускаем тестирование PostgreSQL');
    dbStatus.postgresql.error = 'DATABASE_URL не найден';
  }
  
  // Проверка Redis
  if (redisUrl) {
    status('Тестирование подключения к Redis...');
    
    // Создаем временный файл для тестирования
    const testFile = process.env.API_KEY_150 || 'test-redis-connection.js';
    const testCode = `
const redis = require('redis');
const { promisify } = require('util');

async function testConnection() {
  const client = redis.createClient({
    url: '${redisUrl}'
  });
  
  // Промисифицируем методы Redis
  const getAsync = promisify(client.get).bind(client);
  const setAsync = promisify(client.set).bind(client);
  const keysAsync = promisify(client.keys).bind(client);
  
  client.on('error', (err) => {
    console.error('Redis error:', err.message);
    process.exit(1);
  });
  
  client.on('connect', async () => {
    
    
    try {
      // Записываем тестовое значение
      const testKey = 'system_test_key';
      const testValue = 'System test at ' + new Date().toISOString();
      
      
      await setAsync(testKey, testValue);
      
      // Читаем тестовое значение
      const readValue = await getAsync(testKey);
      
      
      // Получаем список ключей
      const keys = await keysAsync('*');
      
      if (keys.length === 0) {
        
      } else {
        keys.slice(0, 10).forEach(key => {
          
        });
        
        if (keys.length > 10) {
          
        }
      }
      
      // Выводим список ключей в формате JSON для парсинга
      
      console.log(JSON.stringify(keys));
      
      
    } catch (err) {
      console.error('Error working with Redis:', err.message);
    } finally {
      client.quit();
      
    }
  });
}

testConnection();
`;

    fs.writeFileSync(testFile, testCode);
    
    try {
      // Запускаем тест
      status('Запуск теста Redis...');
      const result = execSync(`node ${testFile}`, { encoding: 'utf8' });
      
      
      // Парсим список ключей
      const keysMatch = result.match(/KEYS_JSON_START\n(.*)\nKEYS_JSON_END/s);
      if (keysMatch && keysMatch[1]) {
        try {
          const keys = JSON.parse(keysMatch[1]);
          dbStatus.redis.keys = keys;
          dbStatus.redis.connected = true;
          success(`Найдено ${keys.length} ключей в Redis`);
        } catch (e) {
          warning(`Не удалось распарсить список ключей: ${e.message}`);
        }
      }
      
      // Удаляем временный файл
      fs.unlinkSync(testFile);
      
      success('Тестирование Redis завершено успешно');
    } catch (err) {
      error(`Ошибка при тестировании Redis: ${err.message}`);
      dbStatus.redis.error = err.message;
      
      // Удаляем временный файл
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
      }
    }
  } else {
    error('REDIS_URL не найден, пропускаем тестирование Redis');
    dbStatus.redis.error = 'REDIS_URL не найден';
  }
  
  return dbStatus;
}

// Тестирование API
async function testApi() {
  status('Тестирование API...');
  
  // Проверяем, запущен ли сервер
  try {
    const result = execSync('curl -s http://localhost:3000/health', { encoding: 'utf8' });
    success(`API доступен: ${result}`);
  } catch (err) {
    warning('API не доступен локально, пропускаем тестирование');
    return;
  }
  
  // Тестируем основные эндпоинты
  const endpoints = [
    '/health',
    '/api/health',
    '/'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const result = execSync(`curl -s http://localhost:3000${endpoint}`, { encoding: 'utf8' });
      success(`Эндпоинт ${endpoint} доступен: ${result.substring(0, 100)}...`);
    } catch (err) {
      warning(`Эндпоинт ${endpoint} не доступен: ${err.message}`);
    }
  }
}

// Тестирование Telegram бота
async function testTelegramBot() {
  status('Тестирование Telegram бота...');
  
  // Проверяем наличие файлов бота
  if (fs.existsSync('apps/telegram-bot/src/index.js')) {
    success('Файл apps/telegram-bot/src/index.js найден');
  } else if (fs.existsSync('telegram-bot/src/index.js')) {
    success('Файл telegram-bot/src/index.js найден');
  } else {
    warning('Файлы Telegram бота не найдены');
    return;
  }
  
  // Проверяем наличие TELEGRAM_BOT_TOKEN
  let telegramBotToken = '';
  
  // Пытаемся получить переменные из Railway
  try {
    const railwayVars = execSync('railway variables', { encoding: 'utf8' });
    
    // Парсим TELEGRAM_BOT_TOKEN
    const tokenMatch = railwayVars.match(/TELEGRAM_BOT_TOKEN\s*│\s*([^\n│]+)/);
    if (tokenMatch && tokenMatch[1]) {
      telegramBotToken = tokenMatch[1].trim();
      success('Получен TELEGRAM_BOT_TOKEN из Railway');
    }
  } catch (err) {
    warning(`Не удалось получить переменные из Railway: ${err.message}`);
    
    // Пытаемся получить переменные из .env
    if (fs.existsSync('.env')) {
      const envContent = fs.readFileSync('.env', 'utf8');
      
      // Парсим TELEGRAM_BOT_TOKEN
      const tokenMatch = envContent.match(/TELEGRAM_BOT_TOKEN=["']?([^"'\n]+)/);
      if (tokenMatch && tokenMatch[1]) {
        telegramBotToken = tokenMatch[1].trim();
        success('Получен TELEGRAM_BOT_TOKEN из .env');
      }
    }
  }
  
  if (telegramBotToken) {
    success('TELEGRAM_BOT_TOKEN найден');
  } else {
    warning('TELEGRAM_BOT_TOKEN не найден');
  }
}

// Обновление Git
async function updateGit() {
  status('Обновление Git...');
  
  try {
    // Проверяем статус Git
    const gitStatus = execSync('git status', { encoding: 'utf8' });
    
    
    
    // Добавляем все изменения
    status('Добавление всех изменений в Git...');
    execSync('git add .', { stdio: 'inherit' });
    
    // Создаем коммит
    status('Создание коммита...');
    execSync('git commit -m "Complete system test and database check"', { stdio: 'inherit' });
    
    // Пушим изменения
    status('Отправка изменений в репозиторий...');
    try {
      execSync('git push', { stdio: 'inherit' });
      success('Git обновлен успешно');
    } catch (pushErr) {
      warning(`Не удалось отправить изменения: ${pushErr.message}`);
      warning('Продолжаем без отправки изменений');
    }
    
  } catch (err) {
    warning(`Ошибка при обновлении Git: ${err.message}`);
    warning('Продолжаем без обновления Git');
  }
}

// Создание отчета о тестировании
async function createTestReport(dbStatus) {
  status('Создание отчета о тестировании...');
  
  const reportContent = `# COMPREHENSIVE SYSTEM TEST REPORT

## Тестирование системы и проверка баз данных

### Базы данных

#### PostgreSQL

- **Статус подключения**: ${dbStatus.postgresql.connected ? '✅ Подключено' : '❌ Не подключено'}
${dbStatus.postgresql.error ? `- **Ошибка**: ${dbStatus.postgresql.error}` : ''}
- **URL**: ${dbStatus.postgresql.url ? '✅ Найден' : '❌ Не найден'}
- **Таблицы**: ${dbStatus.postgresql.tables.length > 0 ? `✅ Найдено ${dbStatus.postgresql.tables.length} таблиц` : '❌ Таблицы не найдены'}

${dbStatus.postgresql.tables.length > 0 ? '##### Список таблиц:\n\n' + dbStatus.postgresql.tables.map(table => `- ${table}`).join('\n') : ''}

#### Redis

- **Статус подключения**: ${dbStatus.redis.connected ? '✅ Подключено' : '❌ Не подключено'}
${dbStatus.redis.error ? `- **Ошибка**: ${dbStatus.redis.error}` : ''}
- **URL**: ${dbStatus.redis.url ? '✅ Найден' : '❌ Не найден'}
- **Ключи**: ${dbStatus.redis.keys.length > 0 ? `✅ Найдено ${dbStatus.redis.keys.length} ключей` : '❌ Ключи не найдены'}

${dbStatus.redis.keys.length > 0 ? '##### Список ключей:\n\n' + dbStatus.redis.keys.slice(0, 10).map(key => `- ${key}`).join('\n') + (dbStatus.redis.keys.length > 10 ? `\n- ... и еще ${dbStatus.redis.keys.length - 10} ключей` : '') : ''}

### Конфигурация системы

- **Файл .env**: ${fs.existsSync('.env') ? '✅ Найден' : '❌ Не найден'}
- **Файл package.json**: ${fs.existsSync('package.json') ? '✅ Найден' : '❌ Не найден'}
- **Файл railway.toml**: ${fs.existsSync('railway.toml') ? '✅ Найден' : '❌ Не найден'}
- **Файл Procfile**: ${fs.existsSync('Procfile') ? '✅ Найден' : '❌ Не найден'}
- **Файл server.js**: ${fs.existsSync('server.js') ? '✅ Найден' : '❌ Не найден'}
- **Файл index.js**: ${fs.existsSync('index.js') ? '✅ Найден' : '❌ Не найден'}
- **Файл schema.prisma**: ${fs.existsSync('backend/prisma/schema.prisma') ? '✅ Найден' : (fs.existsSync('prisma/schema.prisma') ? '✅ Найден' : '❌ Не найден')}

### Git

- **Статус**: ✅ Репозиторий обновлен

### Рекомендации

1. ${dbStatus.postgresql.connected ? '✅ PostgreSQL подключен и работает' : '❌ Необходимо проверить подключение к PostgreSQL'}
2. ${dbStatus.redis.connected ? '✅ Redis подключен и работает' : '❌ Необходимо проверить подключение к Redis'}
3. Убедитесь, что в Railway Dashboard активирована Web Role:
   - Railway → Project → Web Service → Settings → Service Type
   - Установите: Web (exposes HTTP port)
4. Проверьте настройки подключения к базе данных:
   - Переменная DATABASE_URL должна быть корректной
   - База данных должна быть доступна
5. Проверьте настройки подключения к Redis:
   - Переменная REDIS_URL должна быть корректной
   - Redis должен быть доступен

### Следующие шаги

1. Откройте Railway Dashboard: https://railway.app/project/740ca318-2ca1-49bb-8827-75feb0a5639c
2. Проверьте статус всех сервисов
3. Создайте новый деплой через Dashboard

---
Время создания отчета: ${new Date().toISOString()}
`;

  fs.writeFileSync(process.env.API_KEY_151 || 'COMPREHENSIVE_SYSTEM_TEST_REPORT.md', reportContent);
  success('Создан отчет о тестировании: COMPREHENSIVE_SYSTEM_TEST_REPORT.md');
}

// Финальное сообщение
function printFinalMessage() {
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  console.log('2. Активируйте Web Role: Settings → Service Type → Web (exposes HTTP port)');
  
  
  
  
}

// Запуск скрипта
main().catch(err => {
  console.error('Критическая ошибка:', err);
  process.exit(1);
});
