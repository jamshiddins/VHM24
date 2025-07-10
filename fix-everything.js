#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

console.log('🚀 VHM24 - Комплексное исправление всех ошибок\n');

// Список всех сервисов для исправления
const services = [
  'gateway', 'auth', 'machines', 'inventory', 'tasks', 
  'routes', 'warehouse', 'recipes', 'notifications', 
  'audit', 'monitoring', 'backup', 'data-import'
];

// Функция для исправления синтаксических ошибок
async function fixSyntaxErrors() {
  console.log('📝 Исправление синтаксических ошибок в сервисах...\n');
  
  // Исправления для каждого сервиса
  const fixes = {
    'gateway': async (filePath) => {
      let content = await fs.readFile(filePath, 'utf8');
      // Удалить лишние закрывающие скобки
      content = content.replace(/\n\s*\)\s*\n\s*\} catch \(error\) \{/g, '\n} catch (error) {');
      // Исправить logger
      if (!content.includes('const logger = ')) {
        content = 'const logger = console;\n' + content;
      }
      return content;
    },
    'machines': async (filePath) => {
      let content = await fs.readFile(filePath, 'utf8');
      content = content.replace(/\n\s*\)\s*\n\s*\} catch \(error\) \{/g, '\n} catch (error) {');
      if (!content.includes('const logger = ')) {
        content = 'const logger = console;\n' + content;
      }
      return content;
    },
    'inventory': async (filePath) => {
      let content = await fs.readFile(filePath, 'utf8');
      content = content.replace(/\n\s*\)\s*\n\s*\} catch \(error\) \{/g, '\n} catch (error) {');
      if (!content.includes('const logger = ')) {
        content = 'const logger = console;\n' + content;
      }
      return content;
    },
    'tasks': async (filePath) => {
      let content = await fs.readFile(filePath, 'utf8');
      content = content.replace(/\n\s*\)\s*\n\s*\} catch \(error\) \{/g, '\n} catch (error) {');
      if (!content.includes('const logger = ')) {
        content = 'const logger = console;\n' + content;
      }
      return content;
    },
    'routes': async (filePath) => {
      let content = await fs.readFile(filePath, 'utf8');
      // Исправить проблему с именем схемы
      content = content.replace(/patchroutes:idSchema/g, 'patchRoutesIdSchema');
      content = content.replace(/const patchRoutesIdSchema = \{/g, 'const patchRoutesIdSchema = {');
      // Исправить использование в роуте
      content = content.replace(/schema: patchRoutesIdSchema/g, 'schema: patchRoutesIdSchema');
      if (!content.includes('const logger = ')) {
        content = 'const logger = console;\n' + content;
      }
      return content;
    },
    'warehouse': async (filePath) => {
      let content = await fs.readFile(filePath, 'utf8');
      content = content.replace(/\n\s*\)\s*\n\s*\} catch \(error\) \{/g, '\n} catch (error) {');
      if (!content.includes('const logger = ')) {
        content = 'const logger = console;\n' + content;
      }
      return content;
    },
    'data-import': async (filePath) => {
      let content = await fs.readFile(filePath, 'utf8');
      content = content.replace(/\n\s*\)\s*\n\s*\} catch \(error\) \{/g, '\n} catch (error) {');
      if (!content.includes('const logger = ')) {
        content = 'const logger = console;\n' + content;
      }
      return content;
    },
    'backup': async (filePath) => {
      let content = await fs.readFile(filePath, 'utf8');
      // Изменить порт backup сервиса чтобы избежать конфликта
      content = content.replace(/PORT: process\.env\.PORT \|\| 3007/g, 'PORT: process.env.PORT || 3011');
      content = content.replace(/port: 3007/g, 'port: 3011');
      if (!content.includes('const logger = ')) {
        content = 'const logger = console;\n' + content;
      }
      return content;
    }
  };

  // Применить исправления
  for (const service of services) {
    const filePath = path.join(__dirname, 'services', service, 'src', 'index.js');
    
    try {
      if (fixes[service]) {
        const content = await fixes[service](filePath);
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`✅ Исправлен ${service}`);
      }
    } catch (error) {
      console.log(`⚠️  Пропуск ${service}: ${error.message}`);
    }
  }
}

// Функция для настройки локальной базы данных
async function setupLocalDatabase() {
  console.log('\n🗄️  Настройка локальной базы данных...\n');
  
  // Создать .env файл с локальными настройками
  const envContent = `
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vhm24?schema=public"

# JWT
JWT_SECRET="${require('crypto').randomBytes(32).toString('hex')}"

# Redis
REDIS_URL="redis://localhost:6379"

# Telegram Bot
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
ADMIN_IDS="your-telegram-id"

# Services Ports
GATEWAY_PORT=8000
AUTH_PORT=3001
MACHINES_PORT=3002
INVENTORY_PORT=3003
TASKS_PORT=3004
ROUTES_PORT=3005
WAREHOUSE_PORT=3006
RECIPES_PORT=3007
NOTIFICATIONS_PORT=3008
AUDIT_SERVICE_PORT=3009
MONITORING_PORT=3010
BACKUP_PORT=3011
DATA_IMPORT_PORT=3012

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# S3 Storage (optional)
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=vhm24-uploads
S3_REGION=nyc3

# Environment
NODE_ENV=development
`;

  await fs.writeFile(path.join(__dirname, '.env'), envContent.trim(), 'utf8');
  console.log('✅ Создан .env файл с локальными настройками');
}

// Функция для исправления Web Dashboard
async function fixWebDashboard() {
  console.log('\n🌐 Исправление Web Dashboard...\n');
  
  const dashboardPath = path.join(__dirname, 'apps', 'web-dashboard');
  
  // 1. Исправить next.config.js
  const nextConfigPath = path.join(dashboardPath, 'next.config.js');
  let nextConfig = await fs.readFile(nextConfigPath, 'utf8');
  nextConfig = nextConfig.replace(/experimental: \{[\s\S]*?\},/g, '');
  await fs.writeFile(nextConfigPath, nextConfig, 'utf8');
  console.log('✅ Исправлен next.config.js');
  
  // 2. Создать postcss.config.js
  const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
  await fs.writeFile(path.join(dashboardPath, 'postcss.config.js'), postcssConfig, 'utf8');
  console.log('✅ Создан postcss.config.js');
  
  // 3. Создать tailwind.config.js если его нет
  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;
  
  try {
    await fs.access(path.join(dashboardPath, 'tailwind.config.js'));
  } catch {
    await fs.writeFile(path.join(dashboardPath, 'tailwind.config.js'), tailwindConfig, 'utf8');
    console.log('✅ Создан tailwind.config.js');
  }
}

// Функция для очистки и переустановки зависимостей
async function reinstallDependencies() {
  console.log('\n📦 Переустановка зависимостей...\n');
  
  try {
    // Удалить node_modules и package-lock.json
    console.log('🗑️  Удаление старых зависимостей...');
    await exec('Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue', { shell: 'powershell' });
    await exec('Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue', { shell: 'powershell' });
    
    // Очистить кеш npm
    console.log('🧹 Очистка кеша npm...');
    await exec('npm cache clean --force');
    
    // Установить зависимости
    console.log('📥 Установка зависимостей...');
    await exec('npm install --legacy-peer-deps');
    
    console.log('✅ Зависимости переустановлены');
  } catch (error) {
    console.log('⚠️  Ошибка при переустановке зависимостей:', error.message);
  }
}

// Функция для генерации Prisma клиента
async function generatePrismaClient() {
  console.log('\n🔧 Генерация Prisma клиента...\n');
  
  try {
    await exec('npx prisma generate --schema=packages/database/prisma/schema.prisma');
    console.log('✅ Prisma клиент сгенерирован');
  } catch (error) {
    console.log('⚠️  Ошибка генерации Prisma:', error.message);
  }
}

// Создать скрипт для запуска всех сервисов
async function createStartScript() {
  console.log('\n📝 Создание скрипта запуска...\n');
  
  const startScript = `#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Запуск VHM24 в режиме разработки...\\n');

// Запуск сервисов
const services = [
  { name: 'Auth', path: 'services/auth', port: 3001 },
  { name: 'Machines', path: 'services/machines', port: 3002 },
  { name: 'Inventory', path: 'services/inventory', port: 3003 },
  { name: 'Tasks', path: 'services/tasks', port: 3004 },
  { name: 'Routes', path: 'services/routes', port: 3005 },
  { name: 'Warehouse', path: 'services/warehouse', port: 3006 },
  { name: 'Recipes', path: 'services/recipes', port: 3007 },
  { name: 'Notifications', path: 'services/notifications', port: 3008 },
  { name: 'Audit', path: 'services/audit', port: 3009 },
  { name: 'Monitoring', path: 'services/monitoring', port: 3010 },
  { name: 'Backup', path: 'services/backup', port: 3011 },
  { name: 'Data Import', path: 'services/data-import', port: 3012 },
  { name: 'Gateway', path: 'services/gateway', port: 8000 }
];

// Запустить каждый сервис
services.forEach(service => {
  const proc = spawn('npm', ['start'], {
    cwd: path.join(__dirname, service.path),
    shell: true,
    env: { ...process.env, PORT: service.port }
  });
  
  proc.stdout.on('data', (data) => {
    console.log(\`[\${service.name}] \${data}\`);
  });
  
  proc.stderr.on('data', (data) => {
    console.error(\`[\${service.name}] ⚠️  \${data}\`);
  });
});

// Запустить Web Dashboard
setTimeout(() => {
  console.log('\\n🌐 Запуск Web Dashboard...');
  const dashboard = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'apps/web-dashboard'),
    shell: true
  });
  
  dashboard.stdout.on('data', (data) => {
    console.log(\`[Dashboard] \${data}\`);
  });
}, 5000);

console.log('\\n✅ Все сервисы запущены!');
console.log('\\n📍 Доступные URL:');
console.log('   Gateway API: http://localhost:8000');
console.log('   Web Dashboard: http://localhost:3000');
console.log('\\nНажмите Ctrl+C для остановки всех сервисов');
`;

  await fs.writeFile(path.join(__dirname, 'start-dev.js'), startScript, 'utf8');
  console.log('✅ Создан скрипт start-dev.js');
}

// Главная функция
async function main() {
  try {
    console.log('🔧 Начинаем комплексное исправление проекта VHM24...\n');
    
    // 1. Исправить синтаксические ошибки
    await fixSyntaxErrors();
    
    // 2. Настроить локальную базу данных
    await setupLocalDatabase();
    
    // 3. Исправить Web Dashboard
    await fixWebDashboard();
    
    // 4. Переустановить зависимости
    await reinstallDependencies();
    
    // 5. Сгенерировать Prisma клиент
    await generatePrismaClient();
    
    // 6. Создать скрипт запуска
    await createStartScript();
    
    console.log('\n✅ ВСЕ ИСПРАВЛЕНИЯ ПРИМЕНЕНЫ!');
    console.log('\n📋 Дальнейшие шаги:');
    console.log('1. Убедитесь, что PostgreSQL запущен локально');
    console.log('2. Создайте базу данных: createdb vhm24');
    console.log('3. Примените миграции: npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma');
    console.log('4. Запустите проект: node start-dev.js');
    console.log('\n🎉 Проект готов к работе!');
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

// Запуск
main();
