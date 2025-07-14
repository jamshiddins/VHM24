#!/usr/bin/env node



const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

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

// Функция для создания файла с проверкой существования директории
function writeFileWithDirCheck(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content);
}

// Главная функция
async function main() {
  
  
  

  try {
    // 1. Проверка package.json
    checkPackageJson();
    
    // 2. Проверка серверных файлов
    checkServerFiles();
    
    // 3. Создание Procfile
    createProcfile();
    
    // 4. Создание railway.toml
    createRailwayToml();
    
    // 5. Создание nixpacks.toml
    createNixpacksToml();
    
    // 6. Проверка .env файла
    checkEnvFile();
    
    // 7. Создание .node-version
    createNodeVersion();
    
    // 8. Создание README.md
    createReadme();
    
    // 9. Создание руководства по деплою
    createDeploymentGuide();
    
    // Финальное сообщение
    printFinalMessage();
    
  } catch (err) {
    error(`Произошла ошибка: ${err.message}`);
    console.error(err);
  }
}

// Проверка package.json
function checkPackageJson() {
  status('Проверка package.json...');
  
  if (!fs.existsSync('package.json')) {
    warning('package.json не найден, создаем минимальный...');
    
    const packageJson = {
      name: 'vhm24',
      version: '1.0.0',
      main: 'server.js',
      scripts: {
        start: 'node server.js'
      },
      dependencies: {
        express: '^4.18.2'
      },
      engines: {
        node: '>=14.0.0'
      }
    };
    
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    success('Создан минимальный package.json');
  } else {
    status('package.json найден, проверяем скрипты...');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      // Проверяем наличие скрипта start
      if (!packageJson.scripts || !packageJson.scripts.start) {
        warning('Скрипт start не найден, добавляем...');
        
        if (!packageJson.scripts) {
          packageJson.scripts = {};
        }
        
        packageJson.scripts.start = 'node server.js';
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
        success('Добавлен скрипт start в package.json');
      } else {
        success('Скрипт start уже существует в package.json');
      }
      
      // Проверяем наличие express в зависимостях
      if (!packageJson.dependencies || !packageJson.dependencies.express) {
        warning('Express не найден в зависимостях, добавляем...');
        
        if (!packageJson.dependencies) {
          packageJson.dependencies = {};
        }
        
        packageJson.dependencies.express = '^4.18.2';
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
        success('Добавлен express в зависимости');
      }
    } catch (err) {
      error(`Ошибка при чтении package.json: ${err.message}`);
      
      // Создаем резервную копию и новый файл
      if (fs.existsSync('package.json')) {
        fs.copyFileSync('package.json', 'package.json.backup');
        warning('Создана резервная копия package.json.backup');
      }
      
      const packageJson = {
        name: 'vhm24',
        version: '1.0.0',
        main: 'server.js',
        scripts: {
          start: 'node server.js'
        },
        dependencies: {
          express: '^4.18.2'
        }
      };
      
      fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
      success('Создан новый package.json');
    }
  }
}

// Проверка серверных файлов
function checkServerFiles() {
  status('Проверка серверных файлов...');
  
  let serverFile = '';
  
  if (fs.existsSync('server.js')) {
    serverFile = 'server.js';
  } else if (fs.existsSync('index.js')) {
    serverFile = 'index.js';
  } else if (fs.existsSync('app.js')) {
    serverFile = 'app.js';
  } else {
    warning('Не найден основной файл сервера, создаем server.js...');
    
    const serverContent = `const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'VHM24 VendHub Management System',
    status: 'online',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// API health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'VHM24',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  
  
  
});`;
    
    fs.writeFileSync('server.js', serverContent);
    serverFile = 'server.js';
    success('Создан минимальный server.js');
  }
  
  // Проверка правильности прослушивания порта
  status(`Проверка прослушивания порта в ${serverFile}...`);
  
  try {
    const serverContent = fs.readFileSync(serverFile, 'utf8');
    
    if (!serverContent.includes('process.env.PORT')) {
      warning(`Не найдено прослушивание process.env.PORT в ${serverFile}, исправляем...`);
      
      // Создаем бэкап
      fs.copyFileSync(serverFile, `${serverFile}.backup`);
      success(`Создан бэкап ${serverFile}.backup`);
      
      let newContent = serverContent;
      
      // Пытаемся найти строку с app.listen и заменить ее
      if (serverContent.includes('app.listen')) {
        // Регулярное выражение для поиска app.listen
        const listenRegex = /app\.listen\s*\(\s*(?:[^,)]+)(?:,\s*[^,)]+)?\s*(?:,\s*[^)]+)?\s*\)/;
        newContent = serverContent.replace(listenRegex, `app.listen(process.env.PORT || 3000, '0.0.0.0')`);
      } else {
        // Если не нашли app.listen, добавляем в конец файла
        newContent += `\n\n// Start server\napp.listen(process.env.PORT || 3000, '0.0.0.0', () => {\n  \n});`;
      }
      
      fs.writeFileSync(serverFile, newContent);
      success(`Исправлено прослушивание порта в ${serverFile}`);
    } else {
      success(`Прослушивание process.env.PORT уже настроено в ${serverFile}`);
    }
  } catch (err) {
    error(`Ошибка при чтении ${serverFile}: ${err.message}`);
  }
}

// Создание Procfile
function createProcfile() {
  status('Проверка наличия Procfile...');
  
  if (!fs.existsSync('Procfile')) {
    fs.writeFileSync('Procfile', 'web: npm start');
    success('Создан Procfile');
  } else {
    success('Procfile уже существует');
  }
}

// Создание railway.toml
function createRailwayToml() {
  status('Проверка наличия railway.toml...');
  
  if (!fs.existsSync('railway.toml')) {
    const railwayToml = `[build]
builder = "nixpacks"
buildCommand = "npm install"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "always"
restartPolicyMaxRetries = 10

[[services]]
name = "web"
`;
    
    fs.writeFileSync('railway.toml', railwayToml);
    success('Создан railway.toml');
  } else {
    // Проверяем наличие healthcheckPath
    try {
      const railwayToml = fs.readFileSync('railway.toml', 'utf8');
      
      if (!railwayToml.includes('healthcheckPath')) {
        warning('Не найден healthcheckPath в railway.toml, добавляем...');
        
        let newContent = railwayToml;
        
        // Проверяем наличие секции [deploy]
        if (railwayToml.includes('[deploy]')) {
          // Добавляем после [deploy]
          newContent = railwayToml.replace(/\[deploy\]/, '[deploy]\nhealthcheckPath = "/health"');
        } else {
          // Добавляем новую секцию
          newContent += `\n[deploy]\nhealthcheckPath = "/health"\nhealthcheckTimeout = 300\nrestartPolicyType = "always"\n`;
        }
        
        fs.writeFileSync('railway.toml', newContent);
        success('Добавлен healthcheckPath в railway.toml');
      } else {
        success('healthcheckPath уже настроен в railway.toml');
      }
    } catch (err) {
      error(`Ошибка при чтении railway.toml: ${err.message}`);
    }
  }
}

// Создание nixpacks.toml
function createNixpacksToml() {
  status('Проверка наличия nixpacks.toml...');
  
  if (!fs.existsSync('nixpacks.toml')) {
    const nixpacksToml = `[phases.setup]
nixPkgs = ["nodejs-18_x", "npm-9_x"]

[phases.install]
cmds = ["npm install"]

[phases.build]
cmds = ["echo 'Build phase'"]

[start]
cmd = "npm start"

[variables]
NODE_ENV = "production"
`;
    
    fs.writeFileSync('nixpacks.toml', nixpacksToml);
    success('Создан nixpacks.toml');
  } else {
    success('nixpacks.toml уже существует');
  }
}

// Проверка .env файла
function checkEnvFile() {
  status('Проверка .env файла...');
  
  if (!fs.existsSync('.env')) {
    const envContent = `NODE_ENV=production
PORT=3000
RAILWAY_PUBLIC_URL=https://web-production-73916.up.railway.app
`;
    
    fs.writeFileSync('.env', envContent);
    success('Создан .env файл');
  } else {
    try {
      const envContent = fs.readFileSync('.env', 'utf8');
      let newContent = envContent;
      let updated = false;
      
      // Проверяем наличие PORT
      if (!envContent.includes('PORT=')) {
        newContent += '\nPORT=3000';
        updated = true;
      }
      
      // Проверяем наличие RAILWAY_PUBLIC_URL
      if (!envContent.includes('RAILWAY_PUBLIC_URL=')) {
        newContent += '\nRAILWAY_PUBLIC_URL=https://web-production-73916.up.railway.app';
        updated = true;
      }
      
      if (updated) {
        fs.writeFileSync('.env', newContent);
        success('Обновлен .env файл');
      } else {
        success('.env файл уже содержит необходимые переменные');
      }
    } catch (err) {
      error(`Ошибка при чтении .env: ${err.message}`);
    }
  }
}

// Создание .node-version
function createNodeVersion() {
  status('Проверка .node-version...');
  
  if (!fs.existsSync('.node-version')) {
    fs.writeFileSync('.node-version', '18.17.0');
    success('Создан .node-version');
  } else {
    success('.node-version уже существует');
  }
}

// Создание README.md
function createReadme() {
  status('Проверка README.md...');
  
  if (!fs.existsSync('README.md')) {
    const readmeContent = `# VHM24 VendHub Management System

## Railway Deployment

Проект настроен для деплоя на Railway.

### URL

https://web-production-73916.up.railway.app

### Локальный запуск

\`\`\`bash
npm install
npm start
\`\`\`

### Деплой

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
   - Start Command: npm start
   - Health Check Path: /health
`;
    
    fs.writeFileSync('README.md', readmeContent);
    success('Создан README.md с инструкциями');
  } else {
    success('README.md уже существует');
  }
}

// Создание руководства по деплою
function createDeploymentGuide() {
  status('Создание руководства по деплою на Railway...');
  
  const guideContent = `# Руководство по деплою на Railway

## Проблемы и решения

### Типичные проблемы

1. **Сборка проходит, но не происходит деплой**
   - Нет active deployment
   - Логи пустые
   - Приложение не запускается

2. **404 "Application not found"**
   - Railway не видит сервер
   - Приложение не подключено к web-порту

### Решения

#### 1. Проверьте \`package.json\`

Railway должен понять, как запускать сервер:

\`\`\`json
"scripts": {
  "start": "node index.js" // или app.js / server.js
}
\`\`\`

#### 2. Проверьте прослушивание порта

В коде должно быть:

\`\`\`js
app.listen(process.env.PORT || 3000, () => {
  console.log('Server running...')
})
\`\`\`

Railway **требует** слушать \`process.env.PORT\`.

#### 3. Проверьте \`Procfile\`

Файл \`Procfile\` в корне проекта:

\`\`\`
web: npm start
\`\`\`

#### 4. Проверьте настройки в Railway Dashboard

Зайдите в:

> **Railway → Project → Web Service → Settings → Start Command**

И пропишите:

\`\`\`
npm start
\`\`\`

#### 5. Проверьте тип сервиса

В:

> **Railway → Web Service → Settings → Service Type**

Установите:

\`\`\`
🟢 Web (exposes HTTP port)
\`\`\`

#### 6. Проверьте переменные окружения

В \`.env\`:

\`\`\`env
PORT=3000
RAILWAY_PUBLIC_URL=https://web-production-73916.up.railway.app
\`\`\`

#### 7. Обходной путь: вручную вызовите добавление деплоймента

1. Откройте Railway → Web Service → Deployments
2. Нажмите "New Deployment" вручную
3. Выберите Git ветку или zip-архив
4. Пропишите "Start command": \`npm start\`

## Чек-лист

| Проверка           | Статус                                        |
| ------------------ | --------------------------------------------- |
| Код                | ✅ готов                                       |
| Сервер             | ✅ корректен                                   |
| PORT               | ✅ настроен на \`process.env.PORT\`             |
| Web Role           | ❗ проверить в Dashboard                       |
| Deployment Trigger | ❗ проверить в Dashboard                       |
| Railway Platform   | ❗ может требовать ручного деплоя             |

## Полезные команды

\`\`\`bash
# Деплой
railway up

# Статус
railway status

# Логи
railway logs

# Переменные
railway variables

# Перезапуск
railway restart
\`\`\`
`;
  
  fs.writeFileSync(process.env.API_KEY_201 || 'RAILWAY_DEPLOYMENT_GUIDE.md', guideContent);
  success('Создано руководство RAILWAY_DEPLOYMENT_GUIDE.md');
}

// Финальное сообщение
function printFinalMessage() {
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
}

// Запуск скрипта
main().catch(err => {
  console.error('Критическая ошибка:', err);
  process.exit(1);
});
