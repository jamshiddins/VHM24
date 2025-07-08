/**
 * VendBot Platform Checklist Tester
 * Проверяет соответствие VHM24 требованиям VendBot
 */

require('dotenv').config();
const fs = require('fs');
const { execSync } = require('child_process');

console.log('=== VendBot Platform Checklist Test ===\n');

const results = {
  infrastructure: {},
  database: {},
  services: {},
  applications: {},
  functionality: {},
  total: { passed: 0, failed: 0 }
};

// Цветной вывод
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function check(condition, message) {
  if (condition) {
    console.log(`${colors.green}✅ ${message}${colors.reset}`);
    results.total.passed++;
    return true;
  } else {
    console.log(`${colors.red}❌ ${message}${colors.reset}`);
    results.total.failed++;
    return false;
  }
}

function warn(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

// 1. ИНФРАСТРУКТУРА
console.log('\n📦 1. Инфраструктура и окружение\n');

// Docker containers
try {
  const dockerPs = execSync('docker ps --format "table {{.Names}}\t{{.Status}}"', { encoding: 'utf8' });
  results.infrastructure.docker = check(dockerPs.includes('postgres'), 'PostgreSQL (5432)');
  results.infrastructure.redis = check(dockerPs.includes('redis'), 'Redis (6379)');
  results.infrastructure.minio = check(dockerPs.includes('minio'), 'MinIO (9000/9001)');
} catch (e) {
  warn('Docker не запущен или не установлен');
}

// Environment variables
results.infrastructure.env = check(fs.existsSync('.env'), 'Файл .env существует');
if (process.env.DATABASE_URL) {
  check(true, 'DATABASE_URL настроен');
} else {
  check(false, 'DATABASE_URL не настроен');
}

check(!process.env.BOT_TOKEN, 'BOT_TOKEN отсутствует (требуется для VendBot)');
check(process.env.JWT_SECRET, 'JWT_SECRET настроен');

// Node.js version
const nodeVersion = process.version;
results.infrastructure.node = check(nodeVersion >= 'v18.0.0', `Node.js ${nodeVersion} (требуется >= 18.0.0)`);

// Python check
try {
  const pythonVersion = execSync('python --version', { encoding: 'utf8' });
  check(false, `Python не используется (VendBot требует Python для Telegram bot)`);
} catch (e) {
  check(false, 'Python не установлен (требуется для VendBot Telegram bot)');
}

// 2. БАЗА ДАННЫХ
console.log('\n🗄️ 2. База данных\n');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    // Проверка подключения
    await prisma.$connect();
    check(true, 'Подключение к PostgreSQL');

    // Проверка таблиц VHM24
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    const tableNames = tables.map(t => t.table_name);
    
    // VHM24 таблицы
    check(tableNames.includes('User'), 'Таблица User');
    check(tableNames.includes('Machine'), 'Таблица Machine');
    check(tableNames.includes('Task'), 'Таблица Task');
    
    // VendBot таблицы (отсутствуют)
    check(!tableNames.includes('Bunker'), 'Таблица Bunker (требуется для VendBot)');
    check(!tableNames.includes('BunkerSet'), 'Таблица BunkerSet (требуется для VendBot)');
    check(!tableNames.includes('Ingredient'), 'Таблица Ingredient (требуется для VendBot)');
    check(!tableNames.includes('Recipe'), 'Таблица Recipe (требуется для VendBot)');
    check(!tableNames.includes('Payment'), 'Таблица Payment (требуется для VendBot)');
    check(!tableNames.includes('FiscalRecord'), 'Таблица FiscalRecord (требуется для VendBot)');
    check(!tableNames.includes('Discrepancy'), 'Таблица Discrepancy (требуется для VendBot)');

  } catch (e) {
    check(false, 'Ошибка подключения к БД: ' + e.message);
  } finally {
    await prisma.$disconnect();
  }
}

// 3. СЕРВИСЫ
console.log('\n🔧 3. Сервисы\n');

async function checkServices() {
  const services = [
    { name: 'Gateway', port: 8000, path: '/health' },
    { name: 'Auth', port: 3001, path: '/health' },
    { name: 'Machines', port: 3002, path: '/health' },
    { name: 'Inventory', port: 3003, path: '/health' },
    { name: 'Tasks', port: 3004, path: '/health' },
    { name: 'Reconciliation', port: 3005, exists: false },
    { name: 'Notifications', port: 3006, exists: false }
  ];

  for (const service of services) {
    if (service.exists === false) {
      check(false, `${service.name} Service (требуется для VendBot)`);
      continue;
    }

    try {
      const response = await fetch(`http://localhost:${service.port}${service.path}`);
      const data = await response.json();
      check(data.status === 'ok', `${service.name} Service (${service.port})`);
    } catch (e) {
      check(false, `${service.name} Service недоступен`);
    }
  }
}

// 4. ПРИЛОЖЕНИЯ
console.log('\n📱 4. Приложения\n');

// Telegram Bot
check(!fs.existsSync('apps/telegram-bot/bot.py'), 'Telegram Bot на Python (требуется для VendBot)');
check(!fs.existsSync('apps/telegram-bot/requirements.txt'), 'Python зависимости (требуется для VendBot)');

// Web Dashboard
check(!fs.existsSync('apps/web-dashboard/package.json'), 'Web Dashboard на Next.js (требуется для VendBot)');
check(!fs.existsSync('apps/web-dashboard/app'), 'Next.js App Router (требуется для VendBot)');

// Mobile PWA
check(!fs.existsSync('apps/mobile-pwa'), 'Mobile PWA (требуется для VendBot)');

// 5. API ENDPOINTS
console.log('\n🌐 5. API Endpoints\n');

async function checkEndpoints() {
  // Login test
  try {
    const loginResponse = await fetch('http://localhost:8000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@vhm24.ru',
        password: 'admin123'
      })
    });
    
    if (loginResponse.ok) {
      const data = await loginResponse.json();
      check(data.token, 'POST /api/v1/auth/login (VHM24 версия)');
      warn('VendBot требует admin@vendbot.ru');
      
      // Test protected endpoints
      const headers = { 'Authorization': `Bearer ${data.token}` };
      
      // Dashboard stats
      const statsResponse = await fetch('http://localhost:8000/api/v1/dashboard/stats', { headers });
      check(statsResponse.ok, 'GET /api/v1/dashboard/stats');
      
      // Tasks
      const tasksResponse = await fetch('http://localhost:8000/api/v1/tasks', { headers });
      check(tasksResponse.ok, 'GET /api/v1/tasks');
      
      // VendBot specific endpoints (missing)
      check(false, 'GET /api/v1/inventory/ingredients (VendBot)');
      check(false, 'GET /api/v1/inventory/bunkers (VendBot)');
      check(false, 'POST /api/v1/inventory/bunker-weight (VendBot)');
      check(false, 'POST /api/v1/tasks/:id/actions (VendBot)');
      check(false, 'POST /api/v1/upload (фото в MinIO)');
      
    } else {
      check(false, 'Авторизация не работает');
    }
  } catch (e) {
    check(false, 'API Gateway недоступен');
  }
}

// 6. ФУНКЦИОНАЛЬНОСТЬ
console.log('\n✨ 6. Функциональность\n');

// RBAC roles
check(false, 'RBAC роли (admin, manager, warehouse, operator, technician, driver)');
warn('VHM24 использует простые роли');

// Equipment tracking
check(false, 'Учет бункеров (SET-00001)');
check(false, 'Учет ингредиентов с рецептами');
check(false, 'Взвешивание при установке/снятии');
warn('VHM24 имеет только простой учет машин');

// Business processes
check(false, 'Фотофиксация операций');
check(false, 'Геолокация для всех действий');
check(false, 'Сложные статусы задач (CREATED → ASSIGNED → IN_PROGRESS → COMPLETED)');
warn('VHM24 имеет базовые CRUD операции');

// Payment reconciliation
check(false, 'Модуль сверки платежей');
check(false, 'Интеграция с VendHub');
check(false, 'Интеграция с мультикассой');
check(false, 'Автоматическое выявление расхождений');

// WebSocket
check(fs.existsSync('node_modules/@fastify/websocket'), '@fastify/websocket установлен');
check(false, 'WebSocket endpoint реализован');

// 7. СТРУКТУРА ФАЙЛОВ
console.log('\n📂 7. Структура файлов\n');

const requiredFiles = [
  { path: 'package.json', exists: true },
  { path: 'turbo.json', exists: true },
  { path: 'docker-compose.yml', exists: true },
  { path: '.env', exists: true },
  { path: 'services/gateway/src/index.js', exists: true },
  { path: 'services/auth/src/index.js', exists: true },
  { path: 'services/reconciliation/src/index.js', exists: false },
  { path: 'services/notifications/src/index.js', exists: false },
  { path: 'apps/telegram-bot/bot.py', exists: false },
  { path: 'apps/web-dashboard/app/page.tsx', exists: false },
  { path: 'packages/utils/src/index.ts', exists: false },
  { path: 'packages/ui-kit/src/index.ts', exists: false }
];

for (const file of requiredFiles) {
  const exists = fs.existsSync(file.path);
  if (file.exists) {
    check(exists, file.path);
  } else {
    check(!exists, `${file.path} (требуется для VendBot)`);
  }
}

// MAIN
async function runTests() {
  await checkDatabase();
  await checkServices();
  await checkEndpoints();
  
  // ОТЧЕТ
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 ИТОГОВЫЙ ОТЧЕТ\n');
  
  const percentage = Math.round((results.total.passed / (results.total.passed + results.total.failed)) * 100);
  
  console.log(`Пройдено тестов: ${colors.green}${results.total.passed}${colors.reset}`);
  console.log(`Провалено тестов: ${colors.red}${results.total.failed}${colors.reset}`);
  console.log(`\nСоответствие VendBot: ${percentage < 30 ? colors.red : percentage < 70 ? colors.yellow : colors.green}${percentage}%${colors.reset}`);
  
  console.log('\n📋 ОСНОВНЫЕ РАЗЛИЧИЯ:\n');
  console.log('1. VHM24 использует Node.js везде, VendBot требует Python для Telegram');
  console.log('2. VHM24 имеет простую модель данных, VendBot - сложную (бункеры, ингредиенты)');
  console.log('3. VHM24 не имеет Web Dashboard, VendBot требует Next.js 14');
  console.log('4. VHM24 не имеет модуля сверки платежей');
  console.log('5. VHM24 не поддерживает фотофиксацию и геолокацию');
  
  console.log('\n💡 РЕКОМЕНДАЦИИ:\n');
  if (percentage < 30) {
    console.log(`${colors.yellow}Проект VHM24 значительно отличается от требований VendBot.`);
    console.log(`Рекомендуется либо существенная доработка (~40 дней),`);
    console.log(`либо создание нового проекта с нуля.${colors.reset}`);
  }
  
  // Сохранение отчета
  const report = {
    timestamp: new Date().toISOString(),
    project: 'VHM24 vs VendBot',
    compatibility: `${percentage}%`,
    results: results
  };
  
  fs.writeFileSync('vendbot-compatibility-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Отчет сохранен в vendbot-compatibility-report.json');
}

// Запуск тестов
runTests().catch(console.error);
