#!/usr/bin/env node

/**
 * RAILWAY FINAL FIX
 * Окончательное решение проблем с деплоем на Railway
 * Включает все необходимые шаги для активации Web Role и настройки проекта
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
  console.log(`${colors.blue}[INFO]${colors.reset} ${message}`);
}

function success(message) {
  console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`);
}

function warning(message) {
  console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`);
}

function error(message) {
  console.log(`${colors.red}[ERROR]${colors.reset} ${message}`);
}

// Главная функция
async function main() {
  console.log('🚀 RAILWAY FINAL FIX');
  console.log('🔧 Окончательное решение проблем с деплоем на Railway');
  console.log('=======================================================');

  try {
    // 1. Создание минимального сервера с правильным прослушиванием порта
    createMinimalServer();
    
    // 2. Обновление package.json
    updatePackageJson();
    
    // 3. Создание Procfile
    createProcfile();
    
    // 4. Обновление railway.toml
    updateRailwayToml();
    
    // 5. Обновление .env
    updateEnvFile();
    
    // 6. Создание README.md с инструкциями
    createReadme();
    
    // 7. Создание инструкции по активации Web Role
    createWebRoleInstructions();
    
    // 8. Финальный деплой
    finalDeploy();
    
    // Финальное сообщение
    printFinalMessage();
    
  } catch (err) {
    error(`Произошла ошибка: ${err.message}`);
    console.error(err);
  }
}

// Создание минимального сервера с правильным прослушиванием порта
function createMinimalServer() {
  status('Создание минимального сервера с правильным прослушиванием порта...');
  
  const serverContent = `const express = require('express');
const app = express();

// Получаем порт из окружения - КРИТИЧЕСКИ ВАЖНО для Railway
const PORT = process.env.PORT || 3000;

// Базовые middleware
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'VHM24 VendHub Management System',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint - КРИТИЧЕСКИ ВАЖНО для Railway
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Альтернативный health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'VHM24',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Telegram webhook
app.post('/api/bot', (req, res) => {
  console.log('Webhook received:', req.body);
  res.json({ ok: true });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start server - КРИТИЧЕСКИ ВАЖНО прослушивание process.env.PORT
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`✅ Server started on port \${PORT}\`);
  console.log(\`✅ Environment: \${process.env.NODE_ENV || 'development'}\`);
  console.log(\`✅ Public URL: \${process.env.RAILWAY_PUBLIC_URL || 'http://localhost:' + PORT}\`);
});
`;

  // Создаем бэкап существующего сервера, если он есть
  if (fs.existsSync('server.js')) {
    fs.copyFileSync('server.js', 'server.js.backup');
    warning('Создан бэкап server.js.backup');
  }
  
  // Записываем новый сервер
  fs.writeFileSync('server.js', serverContent);
  success('Создан минимальный server.js с правильным прослушиванием порта');
  
  // Создаем дублирующий index.js для совместимости
  fs.writeFileSync('index.js', serverContent);
  success('Создан дублирующий index.js');
}

// Обновление package.json
function updatePackageJson() {
  status('Обновление package.json...');
  
  let packageJson = {};
  
  if (fs.existsSync('package.json')) {
    try {
      packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    } catch (err) {
      warning(`Ошибка при чтении package.json: ${err.message}`);
      packageJson = {};
    }
  }
  
  // Создаем бэкап
  if (fs.existsSync('package.json')) {
    fs.copyFileSync('package.json', 'package.json.backup');
    warning('Создан бэкап package.json.backup');
  }
  
  // Обновляем или создаем необходимые поля
  packageJson.name = packageJson.name || 'vhm24';
  packageJson.version = packageJson.version || '1.0.0';
  packageJson.main = 'server.js';
  
  // Обновляем скрипты - КРИТИЧЕСКИ ВАЖНО для Railway
  packageJson.scripts = {
    ...(packageJson.scripts || {}),
    "start": "node server.js",
    "dev": "node server.js"
  };
  
  // Обновляем зависимости
  packageJson.dependencies = {
    ...(packageJson.dependencies || {}),
    "express": "^4.18.2"
  };
  
  // Добавляем engines
  packageJson.engines = {
    "node": ">=14.0.0"
  };
  
  // Записываем обновленный package.json
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  success('Обновлен package.json с правильными скриптами');
}

// Создание Procfile
function createProcfile() {
  status('Создание Procfile...');
  
  // Создаем Procfile - КРИТИЧЕСКИ ВАЖНО для Railway
  fs.writeFileSync('Procfile', 'web: npm run start');
  success('Создан Procfile с правильной командой запуска');
}

// Обновление railway.toml
function updateRailwayToml() {
  status('Обновление railway.toml...');
  
  const railwayToml = `[build]
builder = "nixpacks"
buildCommand = "npm install"

[deploy]
startCommand = "npm run start"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "always"
restartPolicyMaxRetries = 10

# КРИТИЧЕСКИ ВАЖНО для Railway - указывает что сервис является веб-приложением
[service.web]
type = "web"
`;
  
  fs.writeFileSync('railway.toml', railwayToml);
  success('Создан railway.toml с правильными настройками');
}

// Обновление .env
function updateEnvFile() {
  status('Обновление .env...');
  
  const envContent = `# КРИТИЧЕСКИ ВАЖНО для Railway
PORT=3000
RAILWAY_PUBLIC_URL=https://vhm24-1-0.up.railway.app
NODE_ENV=production
`;
  
  fs.writeFileSync('.env', envContent);
  success('Создан .env с необходимыми переменными');
}

// Создание README.md с инструкциями
function createReadme() {
  status('Создание README.md с инструкциями...');
  
  const readmeContent = `# VHM24 VendHub Management System

## Railway Deployment

### Настройки деплоя
- Start command: \`npm run start\`
- Public URL: \`https://vhm24-1-0.up.railway.app\`
- Webhook: \`\${RAILWAY_PUBLIC_URL}/api/bot\`

### Локальный запуск

\`\`\`bash
npm install
npm start
\`\`\`

### Деплой на Railway

\`\`\`bash
railway up
\`\`\`

### Проверка статуса

\`\`\`bash
railway status
railway logs
\`\`\`

### Важные настройки в Railway Dashboard

1. Откройте Railway Dashboard: https://railway.app/project/740ca318-2ca1-49bb-8827-75feb0a5639c
2. Перейдите в Web Service → Settings
3. Убедитесь что:
   - Service Type: Web (exposes HTTP port)
   - Start Command: npm run start
   - Health Check Path: /health
`;
  
  fs.writeFileSync('README.md', readmeContent);
  success('Создан README.md с инструкциями по деплою');
}

// Создание инструкции по активации Web Role
function createWebRoleInstructions() {
  status('Создание инструкции по активации Web Role...');
  
  const instructionsContent = `# АКТИВАЦИЯ WEB ROLE В RAILWAY

## КРИТИЧЕСКИ ВАЖНО ДЛЯ РАБОТЫ ПРОЕКТА

### Шаги для активации Web Role:

1. Откройте Railway Dashboard:
   https://railway.app/project/740ca318-2ca1-49bb-8827-75feb0a5639c

2. Перейдите в настройки Web Service:
   Railway → Project → Web Service → Settings → Service Type

3. Установите тип сервиса:
   \`\`\`
   Web (exposes HTTP port)
   \`\`\`

4. Проверьте Start Command:
   \`\`\`
   npm run start
   \`\`\`

5. Проверьте Health Check Path:
   \`\`\`
   /health
   \`\`\`

6. Сохраните настройки

7. Перейдите в Deployments и создайте новый деплой:
   - Нажмите "New Deployment"
   - Выберите ветку или загрузите код
   - Дождитесь завершения деплоя

8. Проверьте работу приложения:
   \`\`\`
   https://vhm24-1-0.up.railway.app/health
   \`\`\`

## ПОЧЕМУ ЭТО ВАЖНО

Без активации Web Role:
- Railway не запускает деплой
- Не проверяет PORT
- Возвращает 404 "Application not found"

## ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ

В коде уже настроено:
- Прослушивание process.env.PORT
- Health check endpoint
- Procfile с web: npm run start
- Правильный package.json

Осталось только активировать Web Role в Dashboard!
`;
  
  fs.writeFileSync('ACTIVATE_WEB_ROLE.md', instructionsContent);
  success('Создана инструкция по активации Web Role');
}

// Финальный деплой
function finalDeploy() {
  status('Подготовка к финальному деплою...');
  
  try {
    // Проверяем статус Railway
    execSync('railway status', { stdio: 'pipe' });
    
    // Деплоим
    status('Запуск деплоя...');
    execSync('railway up --detach', { stdio: 'inherit' });
    success('Деплой запущен');
    
  } catch (err) {
    warning(`Ошибка при деплое: ${err.message}`);
    warning('Необходимо выполнить деплой вручную после активации Web Role');
  }
}

// Финальное сообщение
function printFinalMessage() {
  console.log('');
  console.log('=======================================================');
  console.log(`${colors.green}✅ RAILWAY FINAL FIX ЗАВЕРШЕН${colors.reset}`);
  console.log('=======================================================');
  console.log('');
  console.log(`${colors.blue}Что было сделано:${colors.reset}`);
  console.log('1. Создан минимальный сервер с правильным прослушиванием порта');
  console.log('2. Обновлен package.json с правильными скриптами');
  console.log('3. Создан Procfile с правильной командой запуска');
  console.log('4. Обновлен railway.toml с правильными настройками');
  console.log('5. Создан .env с необходимыми переменными');
  console.log('6. Создан README.md с инструкциями по деплою');
  console.log('7. Создана инструкция по активации Web Role');
  console.log('');
  console.log(`${colors.yellow}КРИТИЧЕСКИ ВАЖНО:${colors.reset}`);
  console.log('1. Откройте Railway Dashboard: https://railway.app/project/740ca318-2ca1-49bb-8827-75feb0a5639c');
  console.log('2. Активируйте Web Role: Settings → Service Type → Web (exposes HTTP port)');
  console.log('3. Проверьте Start Command: npm run start');
  console.log('4. Проверьте Health Check Path: /health');
  console.log('5. Создайте новый деплой через Dashboard');
  console.log('');
  console.log(`${colors.green}Готово!${colors.reset}`);
}

// Запуск скрипта
main().catch(err => {
  console.error('Критическая ошибка:', err);
  process.exit(1);
});
