const logger = require('@vhm24/shared/logger');

const fs = require('fs')
const { promises: fsPromises } = fs;
const path = require('path');

class RailwayPreparation {
  constructor() {
    this.tasks = [];
    this.warnings = [];
  }

  async prepare() {
    logger.info('🚂 Подготовка к деплою на Railway...\n');
    
    try {
      // 1. Проверка и создание необходимых файлов
      this.createRailwayConfig();
      
      // 2. Обновление package.json
      this.updatePackageJson();
      
      // 3. Создание переменных окружения
      this.prepareEnvironmentVariables();
      
      // 4. Адаптация для Railway ограничений
      this.adaptForRailwayLimitations();
      
      // 5. Создание скриптов деплоя
      this.createDeploymentScripts();
      
      // 6. Финальная проверка
      this.finalCheck();
      
      // 7. Генерация инструкций
      this.generateDeploymentGuide();
      
    } catch (error) {
      logger.error('❌ Error during preparation:', error);
      throw error;
    }
  }

  createRailwayConfig() {
    logger.info('📝 Создание Railway конфигурации...');
    
    // Обновляем nixpacks.toml для monorepo
    const nixpacksConfig = `[phases.setup]
nixPkgs = ["nodejs-18_x", "npm-9_x"]

[phases.install]
cmds = ["npm install", "npm install --workspaces"]

[phases.build]
cmds = ["npm run build --if-present"]

[start]
cmd = "npm run start:production"`;
    
    await fsPromises.writeFile('nixpacks.toml', nixpacksConfig);
    this.tasks.push('Updated nixpacks.toml for monorepo');
    
    // Создаем railway.toml для конфигурации сервисов
    const railwayConfig = `[build]
builder = "nixpacks"
buildCommand = "npm install && npm install --workspaces"

[deploy]
startCommand = "npm run start:production"
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "always"

[env]
NODE_ENV = "production"`;
    
    await fsPromises.writeFile('railway.toml', railwayConfig);
    this.tasks.push('Created railway.toml');
  }

  updatePackageJson() {
    logger.info('📦 Обновление package.json...');
    
    const pkg = JSON.parse(await fsPromises.readFile('package.json', 'utf8'));
    
    // Добавляем production скрипты
    pkg.scripts = pkg.scripts || {};
    pkg.scripts['start:production'] = 'node scripts/start-production.js';
    pkg.scripts['build'] = 'npm install --workspaces && npm run build --workspaces --if-present';
    pkg.scripts['railway:deploy'] = 'npm run build && npm run start:production';
    
    // Убедимся что есть engines
    pkg.engines = pkg.engines || {};
    pkg.engines.node = '>=18.0.0';
    pkg.engines.npm = '>=9.0.0';
    
    // Добавляем workspaces если их нет
    if (!pkg.workspaces) {
      pkg.workspaces = [
        "packages/*",
        "services/*",
        "apps/*"
      ];
    }
    
    await fsPromises.writeFile('package.json', JSON.stringify(pkg, null, 2));
    this.tasks.push('Updated root package.json');
  }

  prepareEnvironmentVariables() {
    logger.info('🔐 Подготовка переменных окружения...');
    
    const envExample = `# Railway Environment Variables for VHM24

# ===== ОСНОВНЫЕ НАСТРОЙКИ =====
NODE_ENV=production
PORT=8000

# ===== БАЗА ДАННЫХ =====
# Railway PostgreSQL (автоматически добавляется Railway)
DATABASE_URL=postgresql://user:password@host:port/database

# ===== REDIS =====
# Railway Redis (автоматически добавляется Railway)
REDIS_URL=redis://default:password@host:port

# ===== БЕЗОПАСНОСТЬ =====
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long
JWT_EXPIRES_IN=7d

# ===== ВНУТРЕННИЕ URL СЕРВИСОВ =====
# Railway внутренняя сеть (замените на ваши Railway URLs)
GATEWAY_URL=https://gateway-production.up.railway.app
AUTH_SERVICE_URL=https://auth-production.up.railway.app
MACHINES_SERVICE_URL=https://machines-production.up.railway.app
INVENTORY_SERVICE_URL=https://inventory-production.up.railway.app
TASKS_SERVICE_URL=https://tasks-production.up.railway.app
NOTIFICATIONS_SERVICE_URL=https://notifications-production.up.railway.app
TELEGRAM_BOT_SERVICE_URL=https://telegram-bot-production.up.railway.app

# ===== ВНЕШНИЕ СЕРВИСЫ =====
# Telegram Bot
TELEGRAM_BOT_TOKEN=your-bot-token-from-botfather

# S3 Storage (AWS, DigitalOcean Spaces, или другой S3-совместимый)
S3_BUCKET=your-s3-bucket-name
S3_ACCESS_KEY=your-s3-access-key
S3_SECRET_KEY=your-s3-secret-key
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1

# ===== МОНИТОРИНГ И ЛОГИ =====
LOG_LEVEL=info
SENTRY_DSN=your-sentry-dsn-for-error-tracking

# ===== CORS И БЕЗОПАСНОСТЬ =====
ALLOWED_ORIGINS=https://your-frontend.railway.app,https://your-dashboard.railway.app
CORS_CREDENTIALS=true

# ===== ДОПОЛНИТЕЛЬНЫЕ НАСТРОЙКИ =====
# Таймауты
REQUEST_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=10000

# Лимиты
MAX_FILE_SIZE=10485760
MAX_REQUEST_SIZE=52428800

# Кэширование
CACHE_TTL=3600`;
    
    await fsPromises.writeFile('.env.railway.example', envExample);
    this.tasks.push('Created .env.railway.example');
    
    // Создаем скрипт для проверки переменных
    const envChecker = `const required = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'TELEGRAM_BOT_TOKEN'
];

const optional = [
  'S3_BUCKET',
  'S3_ACCESS_KEY',
  'S3_SECRET_KEY',
  'SENTRY_DSN'
];

logger.info('🔍 Checking environment variables...');

const missing = required.filter(key => !process.env[key]);
const missingOptional = optional.filter(key => !process.env[key]);

if (missing.length > 0) {
  logger.error('❌ Missing required environment variables:');
  missing.forEach(key => logger.error(\`  - \${key}\`));
  process.exit(1);
}

if (missingOptional.length > 0) {
  logger.warn('⚠️ Missing optional environment variables:');
  missingOptional.forEach(key => logger.warn(\`  - \${key}\`));
}

// Проверка JWT секрета
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  logger.error('❌ JWT_SECRET must be at least 32 characters long');
  process.exit(1);
}

// Проверка S3 конфигурации
if (process.env.S3_BUCKET && (!process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY)) {
  logger.error('❌ S3_BUCKET requires S3_ACCESS_KEY and S3_SECRET_KEY');
  process.exit(1);
}

logger.info('✅ All required environment variables are set');
logger.info(\`📊 \${required.length - missing.length}/\${required.length} required variables configured\`);
logger.info(\`📊 \${optional.length - missingOptional.length}/\${optional.length} optional variables configured\`);`;
    
    await fsPromises.writeFile('scripts/check-env.js', envChecker);
    this.tasks.push('Created environment checker script');
  }

  adaptForRailwayLimitations() {
    logger.info('🔧 Адаптация под ограничения Railway...');
    
    // Railway не поддерживает персистентное хранилище
    this.warnings.push('MinIO заменен на внешний S3 - настройте S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY');
    
    // Railway предоставляет только один публичный порт на сервис
    this.warnings.push('Каждый сервис будет иметь свой Railway URL, обновите CORS настройки');
    
    // Создаем middleware для Railway специфичных настроек
    const railwayMiddleware = `// Railway-specific middleware
const railwayMiddleware = (fastify, options, done) => {
  // Добавляем Railway health check headers
  fastify.addHook('onRequest', async (request, reply) => {
    if (request.url === '/health') {
      reply.header('X-Railway-Health', 'ok');
    }
  });
  
  // Обработка Railway внутренних запросов
  fastify.addHook('preHandler', async (request, reply) => {
    // Добавляем Railway request ID если есть
    if (request.headers['x-railway-request-id']) {
      request.railwayRequestId = request.headers['x-railway-request-id'];
    }
  });
  
  // Graceful shutdown для Railway
  const gracefulShutdown = () => {
    logger.info('🛑 Received shutdown signal, closing server gracefully...');
    fastify.close(() => {
      logger.info('✅ Server closed successfully');
      process.exit(0);
    });
  };
  
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
  
  done();
};

module.exports = railwayMiddleware;`;
    
    const middlewareDir = 'packages/shared/middleware';
    if (!fs.existsSync(middlewareDir)) {
      fs.mkdirSync(middlewareDir, { recursive: true });
    }
    
    await fsPromises.writeFile(path.join(middlewareDir, 'railway.js'), railwayMiddleware);
    this.tasks.push('Created Railway-specific middleware');
    
    // Обновляем .railwayignore
    const railwayIgnore = `# Development files
*.log
*.backup.*
node_modules/
.env
.env.local
.env.development

# Test files
coverage/
*.test.js
__tests__/

# Build artifacts
dist/
build/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Temporary files
tmp/
temp/
*.tmp

# Documentation (optional)
docs/
*.md
!README.md

# Scripts not needed in production
scripts/test-*
scripts/dev-*
scripts/local-*`;
    
    await fsPromises.writeFile('.railwayignore', railwayIgnore);
    this.tasks.push('Updated .railwayignore');
  }

  createDeploymentScripts() {
    logger.info('📜 Создание скриптов деплоя...');
    
    // Скрипт для production запуска
    const productionStarter = `// Production starter for Railway deployment
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

logger.info('🚀 Starting VHM24 in production mode on Railway...');

// Проверка переменных окружения
try {
  require('./check-env');
} catch (error) {
  logger.error('❌ Environment check failed:', error.message);
  process.exit(1);
}

// Определяем какой сервис запускать на основе Railway переменных
const SERVICE = process.env.RAILWAY_SERVICE_NAME || 
               process.env.SERVICE_NAME || 
               detectServiceFromPath() ||
               'gateway';

logger.info(\`🎯 Detected service: \${SERVICE}\`);

const serviceMap = {
  'gateway': { path: 'services/gateway', port: 8000, public: true },
  'auth': { path: 'services/auth', port: 3001, public: false },
  'machines': { path: 'services/machines', port: 3002, public: false },
  'inventory': { path: 'services/inventory', port: 3003, public: false },
  'tasks': { path: 'services/tasks', port: 3004, public: false },
  'telegram-bot': { path: 'services/telegram-bot', port: 3005, public: false },
  'notifications': { path: 'services/notifications', port: 3006, public: false },
  'audit': { path: 'services/audit', port: 3007, public: false },
  'data-import': { path: 'services/data-import', port: 3008, public: false },
  'backup': { path: 'services/backup', port: 3009, public: false },
  'monitoring': { path: 'services/monitoring', port: 3010, public: false },
  'routes': { path: 'services/routes', port: 3011, public: false },
  'warehouse': { path: 'services/warehouse', port: 3012, public: false },
  'recipes': { path: 'services/recipes', port: 3013, public: false },
  'bunkers': { path: 'services/bunkers', port: 3014, public: false }
};

const service = serviceMap[SERVICE];

if (!service) {
  logger.error(\`❌ Unknown service: \${SERVICE}\`);
  logger.info('Available services:', Object.keys(serviceMap).join(', '));
  process.exit(1);
}

// Проверяем существование сервиса
if (!fs.existsSync(service.path)) {
  logger.error(\`❌ Service path not found: \${service.path}\`);
  process.exit(1);
}

// Устанавливаем PORT для Railway
process.env.PORT = process.env.PORT || service.port.toString();

logger.info(\`🚀 Starting \${SERVICE} service...\`);
logger.info(\`📁 Path: \${service.path}\`);
logger.info(\`🌐 Port: \${process.env.PORT}\`);
logger.info(\`🔓 Public: \${service.public ? 'Yes' : 'No'}\`);

// Устанавливаем дополнительные переменные для сервиса
process.env.SERVICE_NAME = SERVICE;
process.env.SERVICE_PATH = service.path;

// Запускаем сервис
const child = spawn('npm', ['start'], {
  cwd: service.path,
  stdio: 'inherit',
  env: process.env
});

child.on('error', (error) => {
  logger.error('❌ Failed to start service:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  logger.info(\`🛑 Service \${SERVICE} exited with code \${code}\`);
  process.exit(code);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('🛑 Received SIGTERM, shutting down gracefully...');
  child.kill('SIGTERM');
});

process.on('SIGINT', () => {
  logger.info('🛑 Received SIGINT, shutting down gracefully...');
  child.kill('SIGINT');
});

function detectServiceFromPath() {
  // Пытаемся определить сервис из текущего пути или переменных Railway
  const cwd = process.cwd();
  const servicePath = cwd.split(path.sep).find(part => 
    Object.keys(serviceMap).includes(part)
  );
  
  return servicePath || null;
}`;
    
    await fsPromises.writeFile('scripts/start-production.js', productionStarter);
    this.tasks.push('Created production starter script');
  }

  finalCheck() {
    logger.info('\n🔍 Финальная проверка...');
    
    const checklist = {
      'Root package.json': fs.existsSync('package.json'),
      'Start script': JSON.parse(await fsPromises.readFile('package.json', 'utf8')).scripts?.['start:production'],
      'Node version specified': JSON.parse(await fsPromises.readFile('package.json', 'utf8')).engines?.node,
      'Environment example': fs.existsSync('.env.railway.example'),
      'Railway config': fs.existsSync('railway.toml'),
      'Nixpacks config': fs.existsSync('nixpacks.toml'),
      'S3 adapter': fs.existsSync('packages/shared/storage/s3.js'),
      'Railway middleware': fs.existsSync('packages/shared/middleware/railway.js'),
      'Environment checker': fs.existsSync('scripts/check-env.js'),
      'Production starter': fs.existsSync('scripts/start-production.js')
    };
    
    Object.entries(checklist).forEach(([item, status]) => {
      logger.info(`${status ? '✅' : '❌'} ${item}`);
    });
    
    const passed = Object.values(checklist).filter(Boolean).length;
    const total = Object.keys(checklist).length;
    
    logger.info(`\n📊 Readiness: ${passed}/${total} (${Math.round(passed/total*100)}%)`);
  }

  generateDeploymentGuide() {
    logger.info('\n📚 Генерация руководства по деплою...');
    
    const guide = `# Railway Deployment Guide for VHM24

## 🎯 Обзор

VHM24 готов к деплою на Railway как monorepo с несколькими сервисами.

## 📋 Pre-deployment Checklist

### 1. Подготовка Railway проекта
- [ ] Создан аккаунт на Railway
- [ ] Установлен Railway CLI
- [ ] Выполнен вход

### 2. Настройка внешних сервисов
- [ ] Настроен S3-совместимый storage
- [ ] Создан Telegram Bot
- [ ] Настроен Sentry (опционально)

## 🚀 Deployment Steps

### Шаг 1: Создание Railway проекта
railway new vhm24-production
railway link

### Шаг 2: Добавление баз данных
railway add postgresql
railway add redis

### Шаг 3: Настройка переменных окружения
Скопируйте переменные из .env.railway.example

### Шаг 4: Деплой
railway variables set RAILWAY_SERVICE_NAME="gateway"
railway up

## ⚠️ Важные замечания

${this.warnings.map(w => `- ${w}`).join('\n')}

## 🔧 Troubleshooting

### Проблема: Сервис не запускается
railway logs
railway variables
railway status

### Проблема: База данных не подключается
- Проверьте DATABASE_URL
- Убедитесь что PostgreSQL addon активен

### Проблема: Файлы не загружаются
- Проверьте S3 credentials
- Убедитесь что bucket существует

## 📞 Поддержка

- Railway Discord: https://discord.gg/railway
- Railway Docs: https://docs.railway.app
`;
    
    await fsPromises.writeFile('RAILWAY_DEPLOYMENT_GUIDE.md', guide);
    this.tasks.push('Created comprehensive deployment guide');
    
    logger.info('\n✅ Railway preparation completed!');
    logger.info('\n📋 Completed tasks:');
    this.tasks.forEach(task => logger.info(`  ✅ ${task}`));
    
    if (this.warnings.length > 0) {
      logger.info('\n⚠️ Important warnings:');
      this.warnings.forEach(warning => logger.info(`  ⚠️ ${warning}`));
    }
    
    logger.info('\n📖 Next steps:');
    logger.info('1. Review RAILWAY_DEPLOYMENT_GUIDE.md');
    logger.info('2. Set up external services (S3, Telegram Bot)');
    logger.info('3. Create Railway project: railway new vhm24-production');
    logger.info('4. Add databases: railway add postgresql && railway add redis');
    logger.info('5. Set environment variables from .env.railway.example');
    logger.info('6. Deploy: railway up');
    
    logger.info('\n🎯 Quick start command:');
    logger.info('railway variables set RAILWAY_SERVICE_NAME=gateway && railway up');
  }
}

// Запуск подготовки
const prep = new RailwayPreparation();
prep.prepare().catch(console.error);
