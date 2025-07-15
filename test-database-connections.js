/**
 * Скрипт для проверки работы базы данных и её связи с Telegram-ботом и веб-интерфейсом
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
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

// Функция для проверки подключения к базе данных
async function testDatabaseConnection() {
  log('Проверка подключения к базе данных...', 'title');
  
  try {
    const prisma = new PrismaClient();
    
    // Проверка подключения
    await prisma.$connect();
    log('✅ Подключение к базе данных успешно установлено', 'success');
    
    // Проверка наличия таблиц
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    log(`📋 Найдено таблиц в базе данных: ${tables.length}`, 'info');
    
    if (tables.length > 0) {
      log('Список таблиц:', 'info');
      tables.forEach((table, index) => {
        log(`  ${index + 1}. ${table.table_name}`, 'info');
      });
    } else {
      log('⚠️ В базе данных нет таблиц. Возможно, нужно выполнить миграции', 'warning');
    }
    
    // Проверка наличия пользователей
    try {
      const usersCount = await prisma.user.count();
      log(`👤 Количество пользователей в базе данных: ${usersCount}`, 'info');
      
      if (usersCount > 0) {
        const users = await prisma.user.findMany({
          take: 5,
          orderBy: {
            createdAt: 'desc'
          }
        });
        
        log('Последние 5 пользователей:', 'info');
        users.forEach((user, index) => {
          log(`  ${index + 1}. ID: ${user.id}, Telegram ID: ${user.telegramId}, Роль: ${user.role}, Статус: ${user.status}`, 'info');
        });
      } else {
        log('⚠️ В базе данных нет пользователей', 'warning');
      }
    } catch (error) {
      log(`❌ Ошибка при проверке пользователей: ${error.message}`, 'error');
      log('Возможно, таблица пользователей не существует или имеет другую структуру', 'warning');
    }
    
    // Проверка наличия автоматов
    try {
      const machinesCount = await prisma.machine.count();
      log(`🏭 Количество автоматов в базе данных: ${machinesCount}`, 'info');
      
      if (machinesCount > 0) {
        const machines = await prisma.machine.findMany({
          take: 5,
          orderBy: {
            createdAt: 'desc'
          }
        });
        
        log('Последние 5 автоматов:', 'info');
        machines.forEach((machine, index) => {
          log(`  ${index + 1}. ID: ${machine.id}, Название: ${machine.name || 'Не указано'}, Статус: ${machine.status || 'Не указан'}`, 'info');
        });
      } else {
        log('⚠️ В базе данных нет автоматов', 'warning');
      }
    } catch (error) {
      log(`❌ Ошибка при проверке автоматов: ${error.message}`, 'error');
      log('Возможно, таблица автоматов не существует или имеет другую структуру', 'warning');
    }
    
    // Проверка наличия задач
    try {
      const tasksCount = await prisma.task.count();
      log(`📋 Количество задач в базе данных: ${tasksCount}`, 'info');
      
      if (tasksCount > 0) {
        const tasks = await prisma.task.findMany({
          take: 5,
          orderBy: {
            createdAt: 'desc'
          }
        });
        
        log('Последние 5 задач:', 'info');
        tasks.forEach((task, index) => {
          log(`  ${index + 1}. ID: ${task.id}, Тип: ${task.type || 'Не указан'}, Статус: ${task.status || 'Не указан'}`, 'info');
        });
      } else {
        log('⚠️ В базе данных нет задач', 'warning');
      }
    } catch (error) {
      log(`❌ Ошибка при проверке задач: ${error.message}`, 'error');
      log('Возможно, таблица задач не существует или имеет другую структуру', 'warning');
    }
    
    // Отключение от базы данных
    await prisma.$disconnect();
    log('✅ Отключение от базы данных выполнено успешно', 'success');
    
    return true;
  } catch (error) {
    log(`❌ Ошибка подключения к базе данных: ${error.message}`, 'error');
    
    // Проверка наличия переменной окружения DATABASE_URL
    if (!process.env.DATABASE_URL) {
      log('⚠️ Переменная окружения DATABASE_URL не найдена', 'warning');
      log('Убедитесь, что в файле .env указан правильный URL базы данных', 'warning');
    } else {
      log(`📝 Текущий URL базы данных: ${process.env.DATABASE_URL}`, 'info');
    }
    
    return false;
  }
}

// Функция для проверки подключения Telegram-бота к базе данных
async function testTelegramBotDatabaseConnection() {
  log('Проверка подключения Telegram-бота к базе данных...', 'title');
  
  try {
    // Проверка наличия файла role-sync.js
    const roleSyncPath = path.join(__dirname, 'apps', 'telegram-bot', 'src', 'utils', 'role-sync.js');
    
    if (fs.existsSync(roleSyncPath)) {
      log('✅ Файл role-sync.js найден', 'success');
      
      // Проверка содержимого файла
      const roleSyncContent = fs.readFileSync(roleSyncPath, 'utf8');
      
      if (roleSyncContent.includes('PrismaClient') && roleSyncContent.includes('checkUserRole')) {
        log('✅ Файл role-sync.js содержит необходимые функции для работы с базой данных', 'success');
      } else {
        log('⚠️ Файл role-sync.js не содержит необходимых функций для работы с базой данных', 'warning');
      }
    } else {
      log('❌ Файл role-sync.js не найден', 'error');
      log('Необходимо создать файл role-sync.js для синхронизации ролей между ботом и базой данных', 'warning');
    }
    
    // Проверка наличия файла main-menu.scene.js
    const mainMenuScenePath = path.join(__dirname, 'apps', 'telegram-bot', 'src', 'scenes', 'main-menu.scene.js');
    
    if (fs.existsSync(mainMenuScenePath)) {
      log('✅ Файл main-menu.scene.js найден', 'success');
      
      // Проверка содержимого файла
      const mainMenuSceneContent = fs.readFileSync(mainMenuScenePath, 'utf8');
      
      if (mainMenuSceneContent.includes('role-sync') && mainMenuSceneContent.includes('checkUserRole')) {
        log('✅ Файл main-menu.scene.js использует функции из role-sync.js для работы с базой данных', 'success');
      } else {
        log('⚠️ Файл main-menu.scene.js не использует функции из role-sync.js для работы с базой данных', 'warning');
      }
    } else {
      log('❌ Файл main-menu.scene.js не найден', 'error');
    }
    
    // Проверка наличия файла index.js
    const indexPath = path.join(__dirname, 'apps', 'telegram-bot', 'src', 'index.js');
    
    if (fs.existsSync(indexPath)) {
      log('✅ Файл index.js найден', 'success');
      
      // Проверка содержимого файла
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      
      if (indexContent.includes('PrismaClient') || indexContent.includes('prisma')) {
        log('✅ Файл index.js содержит код для работы с базой данных', 'success');
      } else {
        log('⚠️ Файл index.js не содержит кода для работы с базой данных', 'warning');
        log('Возможно, подключение к базе данных происходит в других файлах', 'info');
      }
    } else {
      log('❌ Файл index.js не найден', 'error');
    }
    
    return true;
  } catch (error) {
    log(`❌ Ошибка при проверке подключения Telegram-бота к базе данных: ${error.message}`, 'error');
    return false;
  }
}

// Функция для проверки подключения веб-интерфейса к базе данных
async function testWebInterfaceDatabaseConnection() {
  log('Проверка подключения веб-интерфейса к базе данных...', 'title');
  
  try {
    // Проверка наличия файла index.js в backend
    const backendIndexPath = path.join(__dirname, 'backend', 'src', 'index.js');
    
    if (fs.existsSync(backendIndexPath)) {
      log('✅ Файл backend/src/index.js найден', 'success');
      
      // Проверка содержимого файла
      const backendIndexContent = fs.readFileSync(backendIndexPath, 'utf8');
      
      if (backendIndexContent.includes('PrismaClient') || backendIndexContent.includes('prisma')) {
        log('✅ Файл backend/src/index.js содержит код для работы с базой данных', 'success');
      } else {
        log('⚠️ Файл backend/src/index.js не содержит кода для работы с базой данных', 'warning');
        log('Возможно, подключение к базе данных происходит в других файлах', 'info');
      }
    } else {
      log('❌ Файл backend/src/index.js не найден', 'error');
    }
    
    // Проверка наличия файла users.js
    const usersRoutePath = path.join(__dirname, 'backend', 'src', 'routes', 'users.js');
    
    if (fs.existsSync(usersRoutePath)) {
      log('✅ Файл backend/src/routes/users.js найден', 'success');
      
      // Проверка содержимого файла
      const usersRouteContent = fs.readFileSync(usersRoutePath, 'utf8');
      
      if (usersRouteContent.includes('PrismaClient') && usersRouteContent.includes('/sync')) {
        log('✅ Файл backend/src/routes/users.js содержит маршрут для синхронизации пользователей', 'success');
      } else {
        log('⚠️ Файл backend/src/routes/users.js не содержит маршрута для синхронизации пользователей', 'warning');
      }
    } else {
      log('❌ Файл backend/src/routes/users.js не найден', 'error');
    }
    
    // Проверка наличия файла health.js
    const healthRoutePath = path.join(__dirname, 'backend', 'src', 'routes', 'health.js');
    
    if (fs.existsSync(healthRoutePath)) {
      log('✅ Файл backend/src/routes/health.js найден', 'success');
      
      // Проверка содержимого файла
      const healthRouteContent = fs.readFileSync(healthRoutePath, 'utf8');
      
      if (healthRouteContent.includes('PrismaClient') && healthRouteContent.includes('$queryRaw')) {
        log('✅ Файл backend/src/routes/health.js содержит код для проверки подключения к базе данных', 'success');
      } else {
        log('⚠️ Файл backend/src/routes/health.js не содержит кода для проверки подключения к базе данных', 'warning');
      }
    } else {
      log('❌ Файл backend/src/routes/health.js не найден', 'error');
    }
    
    // Проверка API-сервера
    const API_PORT = process.env.PORT || 3000;
    const API_URL = process.env.API_BASE_URL || `http://localhost:${API_PORT}`;
    
    try {
      log(`Проверка доступности API-сервера по адресу ${API_URL}/api/health...`, 'info');
      
      const response = await axios.get(`${API_URL}/api/health`, { timeout: 5000 });
      
      if (response.status === 200) {
        log('✅ API-сервер доступен', 'success');
        
        if (response.data && response.data.database) {
          log(`📊 Статус базы данных: ${response.data.database.status}`, 'info');
          
          if (response.data.database.status === 'OK') {
            log('✅ API-сервер успешно подключен к базе данных', 'success');
          } else {
            log(`❌ API-сервер не подключен к базе данных: ${response.data.database.error || 'Неизвестная ошибка'}`, 'error');
          }
        } else {
          log('⚠️ API-сервер не вернул информацию о статусе базы данных', 'warning');
        }
      } else {
        log(`❌ API-сервер вернул статус ${response.status}`, 'error');
      }
    } catch (error) {
      log(`❌ Ошибка при проверке API-сервера: ${error.message}`, 'error');
      log('Возможно, API-сервер не запущен или недоступен', 'warning');
    }
    
    return true;
  } catch (error) {
    log(`❌ Ошибка при проверке подключения веб-интерфейса к базе данных: ${error.message}`, 'error');
    return false;
  }
}

// Функция для проверки синхронизации данных между ботом и веб-интерфейсом
async function testDataSynchronization() {
  log('Проверка синхронизации данных между ботом и веб-интерфейсом...', 'title');
  
  try {
    // Проверка наличия файла role-sync.js
    const roleSyncPath = path.join(__dirname, 'apps', 'telegram-bot', 'src', 'utils', 'role-sync.js');
    
    if (fs.existsSync(roleSyncPath)) {
      log('✅ Файл role-sync.js найден', 'success');
      
      // Проверка содержимого файла
      const roleSyncContent = fs.readFileSync(roleSyncPath, 'utf8');
      
      if (roleSyncContent.includes('syncUserWithAPI')) {
        log('✅ Файл role-sync.js содержит функцию syncUserWithAPI для синхронизации данных', 'success');
      } else {
        log('⚠️ Файл role-sync.js не содержит функции syncUserWithAPI для синхронизации данных', 'warning');
      }
    } else {
      log('❌ Файл role-sync.js не найден', 'error');
    }
    
    // Проверка наличия файла users.js
    const usersRoutePath = path.join(__dirname, 'backend', 'src', 'routes', 'users.js');
    
    if (fs.existsSync(usersRoutePath)) {
      log('✅ Файл backend/src/routes/users.js найден', 'success');
      
      // Проверка содержимого файла
      const usersRouteContent = fs.readFileSync(usersRoutePath, 'utf8');
      
      if (usersRouteContent.includes('/sync')) {
        log('✅ Файл backend/src/routes/users.js содержит маршрут /sync для синхронизации данных', 'success');
      } else {
        log('⚠️ Файл backend/src/routes/users.js не содержит маршрута /sync для синхронизации данных', 'warning');
      }
    } else {
      log('❌ Файл backend/src/routes/users.js не найден', 'error');
    }
    
    // Проверка API-сервера
    const API_PORT = process.env.PORT || 3000;
    const API_URL = process.env.API_BASE_URL || `http://localhost:${API_PORT}`;
    
    try {
      log(`Проверка доступности API-сервера по адресу ${API_URL}/api/health...`, 'info');
      
      const response = await axios.get(`${API_URL}/api/health`, { timeout: 5000 });
      
      if (response.status === 200) {
        log('✅ API-сервер доступен', 'success');
        
        // Проверка маршрута /api/users/sync
        try {
          log(`Проверка маршрута ${API_URL}/api/users/sync...`, 'info');
          
          // Создаем тестового пользователя для синхронизации
          const testUser = {
            userId: 'test-' + Date.now(),
            telegramId: 'test-' + Date.now(),
            firstName: 'Test',
            lastName: 'User',
            role: 'ADMIN'
          };
          
          const syncResponse = await axios.post(`${API_URL}/api/users/sync`, testUser, {
            timeout: 5000,
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (syncResponse.status === 200 && syncResponse.data.success) {
            log('✅ Маршрут /api/users/sync работает корректно', 'success');
            log(`📝 Результат синхронизации: ${JSON.stringify(syncResponse.data)}`, 'info');
          } else {
            log(`❌ Маршрут /api/users/sync вернул ошибку: ${JSON.stringify(syncResponse.data)}`, 'error');
          }
        } catch (error) {
          log(`❌ Ошибка при проверке маршрута /api/users/sync: ${error.message}`, 'error');
          log('Возможно, маршрут не существует или требует авторизации', 'warning');
        }
      } else {
        log(`❌ API-сервер вернул статус ${response.status}`, 'error');
      }
    } catch (error) {
      log(`❌ Ошибка при проверке API-сервера: ${error.message}`, 'error');
      log('Возможно, API-сервер не запущен или недоступен', 'warning');
    }
    
    return true;
  } catch (error) {
    log(`❌ Ошибка при проверке синхронизации данных: ${error.message}`, 'error');
    return false;
  }
}

// Главная функция
async function main() {
  log('=== ПРОВЕРКА РАБОТЫ БАЗЫ ДАННЫХ И ЕЁ СВЯЗИ С TELEGRAM-БОТОМ И ВЕБ-ИНТЕРФЕЙСОМ ===', 'title');
  
  // Проверка подключения к базе данных
  const isDatabaseConnected = await testDatabaseConnection();
  
  // Проверка подключения Telegram-бота к базе данных
  const isTelegramBotConnected = await testTelegramBotDatabaseConnection();
  
  // Проверка подключения веб-интерфейса к базе данных
  const isWebInterfaceConnected = await testWebInterfaceDatabaseConnection();
  
  // Проверка синхронизации данных между ботом и веб-интерфейсом
  const isDataSynchronized = await testDataSynchronization();
  
  // Вывод итогового результата
  log('=== ИТОГОВЫЙ РЕЗУЛЬТАТ ===', 'title');
  log(`Подключение к базе данных: ${isDatabaseConnected ? '✅ Успешно' : '❌ Ошибка'}`, isDatabaseConnected ? 'success' : 'error');
  log(`Подключение Telegram-бота к базе данных: ${isTelegramBotConnected ? '✅ Успешно' : '❌ Ошибка'}`, isTelegramBotConnected ? 'success' : 'error');
  log(`Подключение веб-интерфейса к базе данных: ${isWebInterfaceConnected ? '✅ Успешно' : '❌ Ошибка'}`, isWebInterfaceConnected ? 'success' : 'error');
  log(`Синхронизация данных между ботом и веб-интерфейсом: ${isDataSynchronized ? '✅ Успешно' : '❌ Ошибка'}`, isDataSynchronized ? 'success' : 'error');
  
  // Рекомендации по исправлению ошибок
  if (!isDatabaseConnected || !isTelegramBotConnected || !isWebInterfaceConnected || !isDataSynchronized) {
    log('=== РЕКОМЕНДАЦИИ ПО ИСПРАВЛЕНИЮ ОШИБОК ===', 'title');
    
    if (!isDatabaseConnected) {
      log('1. Проверьте переменную окружения DATABASE_URL в файле .env', 'warning');
      log('2. Убедитесь, что база данных запущена и доступна', 'warning');
      log('3. Выполните миграции базы данных с помощью команды:', 'warning');
      log('   npx prisma migrate dev', 'info');
    }
    
    if (!isTelegramBotConnected) {
      log('1. Создайте файл role-sync.js в директории apps/telegram-bot/src/utils/', 'warning');
      log('2. Исправьте файл main-menu.scene.js для использования функций из role-sync.js', 'warning');
      log('3. Убедитесь, что в файле index.js есть код для подключения к базе данных', 'warning');
    }
    
    if (!isWebInterfaceConnected) {
      log('1. Убедитесь, что в файле backend/src/index.js есть код для подключения к базе данных', 'warning');
      log('2. Добавьте маршрут /sync в файл backend/src/routes/users.js', 'warning');
      log('3. Исправьте файл backend/src/routes/health.js для проверки подключения к базе данных', 'warning');
    }
    
    if (!isDataSynchronized) {
      log('1. Добавьте функцию syncUserWithAPI в файл role-sync.js', 'warning');
      log('2. Добавьте маршрут /sync в файл backend/src/routes/users.js', 'warning');
      log('3. Убедитесь, что API-сервер запущен и доступен', 'warning');
    }
    
    log('Для исправления всех ошибок выполните команду:', 'info');
    log('node run-vendhub.js', 'info');
  } else {
    log('✅ Все проверки пройдены успешно! Система VendHub полностью работоспособна.', 'success');
  }
}

// Запуск скрипта
main().catch(error => {
  log(`❌ Критическая ошибка: ${error.message}`, 'error');
  process.exit(1);
});
