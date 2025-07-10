#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

console.log('🚀 VHM24 - Настройка для production с Railway и DigitalOcean\n');

// 1. Обновить .env для Railway
async function updateEnvFile() {
  console.log('📝 Обновление .env файла для Railway...');
  
  const envContent = `
# Railway PostgreSQL
DATABASE_URL="postgresql://postgres:ваш-пароль@ваш-хост.railway.app:порт/railway"

# JWT
JWT_SECRET="${require('crypto').randomBytes(32).toString('hex')}"

# Redis (Railway или другой)
REDIS_URL="redis://default:ваш-пароль@ваш-redis-хост:порт"

# Telegram Bot
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
ADMIN_IDS="your-telegram-id"

# Services URLs (для Railway)
GATEWAY_URL=https://vhm24-gateway.up.railway.app
AUTH_URL=https://vhm24-auth.up.railway.app
MACHINES_URL=https://vhm24-machines.up.railway.app
INVENTORY_URL=https://vhm24-inventory.up.railway.app
TASKS_URL=https://vhm24-tasks.up.railway.app
ROUTES_URL=https://vhm24-routes.up.railway.app
WAREHOUSE_URL=https://vhm24-warehouse.up.railway.app
RECIPES_URL=https://vhm24-recipes.up.railway.app
NOTIFICATIONS_URL=https://vhm24-notifications.up.railway.app
AUDIT_URL=https://vhm24-audit.up.railway.app
MONITORING_URL=https://vhm24-monitoring.up.railway.app

# DigitalOcean Spaces
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=vhm24-uploads
S3_REGION=nyc3

# Environment
NODE_ENV=production
`;

  await fs.writeFile(path.join(__dirname, '.env.production'), envContent.trim(), 'utf8');
  console.log('✅ Создан .env.production файл');
  console.log('\n⚠️  ВАЖНО: Заполните реальные данные в .env.production:');
  console.log('   - DATABASE_URL от Railway PostgreSQL');
  console.log('   - REDIS_URL от вашего Redis');
  console.log('   - S3 ключи от DigitalOcean Spaces');
}

// 2. Генерация Prisma клиента
async function generatePrismaClient() {
  console.log('\n🔧 Генерация Prisma клиента...');
  console.log('ℹ️  Prisma клиент - это автогенерируемый код для работы с базой данных');
  
  try {
    // Установка Prisma CLI если нет
    console.log('📦 Установка Prisma CLI...');
    await exec('npm install -D prisma @prisma/client');
    
    // Генерация клиента
    console.log('🔨 Генерация клиента из схемы...');
    await exec('npx prisma generate --schema=packages/database/prisma/schema.prisma');
    
    console.log('✅ Prisma клиент сгенерирован!');
  } catch (error) {
    console.error('❌ Ошибка генерации:', error.message);
  }
}

// 3. Исправить bcrypt для Windows
async function fixBcrypt() {
  console.log('\n🔧 Исправление bcrypt для Windows...');
  try {
    await exec('npm rebuild bcrypt --build-from-source');
    console.log('✅ bcrypt пересобран');
  } catch (error) {
    console.log('⚠️  Не удалось пересобрать bcrypt');
  }
}

// 4. Создать railway.toml для деплоя
async function createRailwayConfig() {
  console.log('\n📝 Создание конфигурации Railway...');
  
  const railwayConfig = `[build]
builder = "nixpacks"
buildCommand = "npm install && npx prisma generate"

[deploy]
startCommand = "node scripts/deploy-to-railway.js"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10

[[services]]
name = "gateway"
port = 8000

[[services]]
name = "auth"
port = 3001

[[services]]
name = "machines"
port = 3002

[[services]]
name = "inventory"
port = 3003

[[services]]
name = "tasks"
port = 3004

[[services]]
name = "routes"
port = 3005

[[services]]
name = "warehouse"
port = 3006

[[services]]
name = "recipes"
port = 3007

[[services]]
name = "notifications"
port = 3008

[[services]]
name = "audit"
port = 3009

[[services]]
name = "monitoring"
port = 3010
`;

  await fs.writeFile(path.join(__dirname, 'railway.toml'), railwayConfig, 'utf8');
  console.log('✅ railway.toml создан');
}

// 5. Создать скрипт для запуска с Railway базой
async function createRailwayStartScript() {
  console.log('\n📝 Создание скрипта для запуска с Railway...');
  
  const startScript = `#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Запуск VHM24 с Railway PostgreSQL...\\n');

// Проверка переменных окружения
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL не установлен!');
  console.log('Скопируйте DATABASE_URL из Railway PostgreSQL и добавьте в .env');
  process.exit(1);
}

// Сервисы для запуска
const services = [
  { name: 'Gateway', path: 'services/gateway', port: 8000 },
  { name: 'Auth', path: 'services/auth', port: 3001 },
  { name: 'Recipes', path: 'services/recipes', port: 3007 },
  { name: 'Notifications', path: 'services/notifications', port: 3008 },
  { name: 'Audit', path: 'services/audit', port: 3009 },
  { name: 'Monitoring', path: 'services/monitoring', port: 3010 }
];

const processes = [];

// Запуск сервисов
services.forEach((service, index) => {
  setTimeout(() => {
    console.log(\`🚀 Запуск \${service.name} на порту \${service.port}...\`);
    
    const proc = spawn('npm', ['start'], {
      cwd: path.join(__dirname, service.path),
      shell: true,
      env: { ...process.env, PORT: service.port }
    });
    
    proc.stdout.on('data', (data) => {
      console.log(\`[\${service.name}] \${data.toString().trim()}\`);
    });
    
    proc.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg && !msg.includes('ExperimentalWarning')) {
        console.error(\`[\${service.name}] ⚠️  \${msg}\`);
      }
    });
    
    processes.push(proc);
  }, index * 2000);
});

// Запуск Web Dashboard
setTimeout(() => {
  console.log('\\n🌐 Запуск Web Dashboard...');
  
  const dashboard = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'apps/web-dashboard'),
    shell: true
  });
  
  dashboard.stdout.on('data', (data) => {
    console.log(\`[Dashboard] \${data.toString().trim()}\`);
  });
  
  processes.push(dashboard);
}, 15000);

// Информация
setTimeout(() => {
  console.log('\\n✅ Все сервисы запущены!');
  console.log('\\n📍 Доступные URL:');
  console.log('   Gateway API: http://localhost:8000');
  console.log('   Web Dashboard: http://localhost:3000');
  console.log('\\n🌐 Для деплоя на Railway:');
  console.log('   1. Создайте проект на Railway');
  console.log('   2. Подключите GitHub репозиторий');
  console.log('   3. Добавьте переменные окружения');
  console.log('   4. Railway автоматически задеплоит проект');
}, 20000);

process.on('SIGINT', () => {
  console.log('\\n🛑 Остановка всех сервисов...');
  processes.forEach(proc => proc.kill());
  process.exit(0);
});
`;

  await fs.writeFile(path.join(__dirname, 'start-with-railway.js'), startScript, 'utf8');
  console.log('✅ start-with-railway.js создан');
}

// Главная функция
async function main() {
  console.log('🔧 Настройка VHM24 для работы с облачными сервисами...\n');
  
  // 1. Обновить .env
  await updateEnvFile();
  
  // 2. Сгенерировать Prisma клиент
  await generatePrismaClient();
  
  // 3. Исправить bcrypt
  await fixBcrypt();
  
  // 4. Создать railway.toml
  await createRailwayConfig();
  
  // 5. Создать скрипт запуска
  await createRailwayStartScript();
  
  console.log('\n✅ ВСЕ ГОТОВО!');
  console.log('\n📋 Дальнейшие шаги:');
  console.log('1. Откройте .env.production и заполните:');
  console.log('   - DATABASE_URL из Railway PostgreSQL');
  console.log('   - REDIS_URL из вашего Redis');
  console.log('   - S3 ключи из DigitalOcean Spaces');
  console.log('\n2. Скопируйте данные в основной .env:');
  console.log('   copy .env.production .env');
  console.log('\n3. Примените миграции к Railway базе:');
  console.log('   npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma');
  console.log('\n4. Запустите проект локально:');
  console.log('   node start-with-railway.js');
  console.log('\n5. Для деплоя на Railway:');
  console.log('   - Загрузите код на GitHub');
  console.log('   - Создайте проект на Railway');
  console.log('   - Подключите репозиторий');
  console.log('   - Railway автоматически задеплоит');
  
  console.log('\n🎉 Проект готов к работе с облачными сервисами!');
}

// Запуск
main().catch(error => {
  console.error('❌ Ошибка:', error);
  process.exit(1);
});
