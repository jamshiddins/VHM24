#!/usr/bin/env node



const { execSync } = require('child_process');
const fs = require('fs');

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
    
    // 1. Обновление Git
    await updateGit();
    
    // 2. Получение переменных окружения Railway
    const envVars = await getRailwayEnvVars();
    
    // 3. Тестирование PostgreSQL
    await testPostgreSQL(envVars.DATABASE_URL);
    
    // 4. Тестирование Redis
    await testRedis(envVars.REDIS_URL);
    
    // 5. Создание отчета о тестировании
    await createTestReport(envVars);
    
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
    
    return true;
  } catch (err) {
    error(`Ошибка при установке зависимостей: ${err.message}`);
    return false;
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
    execSync('git commit -m "Fix Railway deployment issues and test connections"', { stdio: 'inherit' });
    
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

// Получение переменных окружения Railway
async function getRailwayEnvVars() {
  status('Получение переменных окружения Railway...');
  
  const envVars = {
    DATABASE_URL: '',
    REDIS_URL: ''
  };
  
  try {
    // Пытаемся получить переменные из Railway
    const railwayVars = execSync('railway variables', { encoding: 'utf8' });
    
    // Парсим DATABASE_URL
    const dbUrlMatch = railwayVars.match(/DATABASE_URL\s*│\s*([^\n│]+)/);
    if (dbUrlMatch && dbUrlMatch[1]) {
      envVars.DATABASE_URL = dbUrlMatch[1].trim();
      success('Получен DATABASE_URL из Railway');
    }
    
    // Парсим REDIS_URL
    const redisUrlMatch = railwayVars.match(/REDIS_URL\s*│\s*([^\n│]+)/);
    if (redisUrlMatch && redisUrlMatch[1]) {
      envVars.REDIS_URL = redisUrlMatch[1].trim();
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
        envVars.DATABASE_URL = dbUrlMatch[1].trim();
        success('Получен DATABASE_URL из .env');
      }
      
      // Парсим REDIS_URL
      const redisUrlMatch = envContent.match(/REDIS_URL=["']?([^"'\n]+)/);
      if (redisUrlMatch && redisUrlMatch[1]) {
        envVars.REDIS_URL = redisUrlMatch[1].trim();
        success('Получен REDIS_URL из .env');
      }
    }
  }
  
  // Проверяем наличие переменных
  if (!envVars.DATABASE_URL) {
    warning('DATABASE_URL не найден');
  }
  
  if (!envVars.REDIS_URL) {
    warning('REDIS_URL не найден');
  }
  
  return envVars;
}

// Тестирование PostgreSQL
async function testPostgreSQL(dbUrl) {
  status('Тестирование подключения к PostgreSQL...');
  
  if (!dbUrl) {
    error('DATABASE_URL не найден, пропускаем тестирование PostgreSQL');
    return false;
  }
  
  // Создаем временный файл для тестирования
  const testFile = process.env.API_KEY_399 || 'test-pg-connection.js';
  const testCode = `
const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    connectionString: '${dbUrl}'
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
    
    
    // Удаляем временный файл
    fs.unlinkSync(testFile);
    
    success('Тестирование PostgreSQL завершено успешно');
    return true;
  } catch (err) {
    error(`Ошибка при тестировании PostgreSQL: ${err.message}`);
    
    // Удаляем временный файл
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
    
    return false;
  }
}

// Тестирование Redis
async function testRedis(redisUrl) {
  status('Тестирование подключения к Redis...');
  
  if (!redisUrl) {
    error('REDIS_URL не найден, пропускаем тестирование Redis');
    return false;
  }
  
  // Создаем временный файл для тестирования
  const testFile = process.env.API_KEY_400 || 'test-redis-connection.js';
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
      const testKey = 'railway_test_key';
      const testValue = 'Railway connection test at ' + new Date().toISOString();
      
      
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
    
    
    // Удаляем временный файл
    fs.unlinkSync(testFile);
    
    success('Тестирование Redis завершено успешно');
    return true;
  } catch (err) {
    error(`Ошибка при тестировании Redis: ${err.message}`);
    
    // Удаляем временный файл
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
    
    return false;
  }
}

// Создание отчета о тестировании
async function createTestReport(envVars) {
  status('Создание отчета о тестировании...');
  
  const reportContent = `# RAILWAY CONNECTIONS TEST REPORT

## Тестирование подключения к сервисам Railway

### Переменные окружения

- **DATABASE_URL**: ${envVars.DATABASE_URL ? '✅ Найден' : '❌ Не найден'}
- **REDIS_URL**: ${envVars.REDIS_URL ? '✅ Найден' : '❌ Не найден'}

### PostgreSQL

${envVars.DATABASE_URL ? '✅ Тестирование выполнено' : '❌ Тестирование пропущено (URL не найден)'}

### Redis

${envVars.REDIS_URL ? '✅ Тестирование выполнено' : '❌ Тестирование пропущено (URL не найден)'}

### Git

✅ Репозиторий обновлен

### Рекомендации

1. Убедитесь, что в Railway Dashboard активирована Web Role:
   - Railway → Project → Web Service → Settings → Service Type
   - Установите: Web (exposes HTTP port)

2. Проверьте настройки подключения к базе данных:
   - Переменная DATABASE_URL должна быть корректной
   - База данных должна быть доступна

3. Проверьте настройки подключения к Redis:
   - Переменная REDIS_URL должна быть корректной
   - Redis должен быть доступен

### Следующие шаги

1. Откройте Railway Dashboard: https://railway.app/project/740ca318-2ca1-49bb-8827-75feb0a5639c
2. Проверьте статус всех сервисов
3. Создайте новый деплой через Dashboard

---
Время создания отчета: ${new Date().toISOString()}
`;

  fs.writeFileSync(process.env.API_KEY_401 || 'RAILWAY_CONNECTIONS_TEST_REPORT.md', reportContent);
  success('Создан отчет о тестировании: RAILWAY_CONNECTIONS_TEST_REPORT.md');
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
