#!/bin/bash

# ======================================================
# FIX-RAILWAY-PACKAGE.SH
# Автоматическое исправление всех проблем с деплоем на Railway
# ======================================================

echo "🚀 RAILWAY DEPLOYMENT FIXER"
echo "🔧 Исправление всех проблем с деплоем на Railway"
echo "======================================================="

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода статуса
function status() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

function success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

function warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

function error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка наличия package.json
if [ ! -f "package.json" ]; then
  warning "package.json не найден, создаем минимальный..."
  cat > package.json << EOF
{
  "name": "vhm24",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
EOF
  success "Создан минимальный package.json"
else
  status "package.json найден, проверяем скрипты..."
  
  # Проверка и исправление скриптов в package.json
  if ! grep -q '"start"' package.json; then
    status "Добавляем скрипт start в package.json..."
    # Используем временный файл для модификации
    TMP_FILE=$(mktemp)
    jq '.scripts = (.scripts // {}) + {"start": "node server.js"}' package.json > "$TMP_FILE"
    mv "$TMP_FILE" package.json
    success "Добавлен скрипт start в package.json"
  else
    success "Скрипт start уже существует в package.json"
  fi
fi

# Проверка наличия server.js, index.js или app.js
SERVER_FILE=""
if [ -f "server.js" ]; then
  SERVER_FILE="server.js"
elif [ -f "index.js" ]; then
  SERVER_FILE="index.js"
elif [ -f "app.js" ]; then
  SERVER_FILE="app.js"
else
  warning "Не найден основной файл сервера, создаем server.js..."
  cat > server.js << EOF
const express = require('express');
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
  console.log(\`Server running on port \${PORT}\`);
  console.log(\`Environment: \${process.env.NODE_ENV || 'development'}\`);
  console.log(\`Public URL: \${process.env.RAILWAY_PUBLIC_URL || 'http://localhost:' + PORT}\`);
});
EOF
  SERVER_FILE="server.js"
  success "Создан минимальный server.js"
fi

# Проверка правильности прослушивания порта
status "Проверка прослушивания порта в $SERVER_FILE..."
if ! grep -q "process.env.PORT" "$SERVER_FILE"; then
  warning "Не найдено прослушивание process.env.PORT, исправляем..."
  
  # Создаем бэкап
  cp "$SERVER_FILE" "${SERVER_FILE}.backup"
  success "Создан бэкап ${SERVER_FILE}.backup"
  
  # Пытаемся найти строку с app.listen и заменить ее
  if grep -q "app.listen" "$SERVER_FILE"; then
    sed -i 's/app.listen([^)]*)/app.listen(process.env.PORT || 3000, "0.0.0.0")/g' "$SERVER_FILE"
    success "Исправлено прослушивание порта в $SERVER_FILE"
  else
    # Если не нашли app.listen, добавляем в конец файла
    echo -e "\n// Start server\napp.listen(process.env.PORT || 3000, '0.0.0.0', () => {\n  console.log(\`Server running on port \${process.env.PORT || 3000}\`);\n});" >> "$SERVER_FILE"
    success "Добавлено прослушивание порта в $SERVER_FILE"
  fi
else
  success "Прослушивание process.env.PORT уже настроено в $SERVER_FILE"
fi

# Создание Procfile
status "Проверка наличия Procfile..."
if [ ! -f "Procfile" ]; then
  echo "web: npm start" > Procfile
  success "Создан Procfile"
else
  success "Procfile уже существует"
fi

# Создание railway.toml
status "Проверка наличия railway.toml..."
if [ ! -f "railway.toml" ]; then
  cat > railway.toml << EOF
[build]
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
EOF
  success "Создан railway.toml"
else
  # Проверяем наличие healthcheckPath
  if ! grep -q "healthcheckPath" railway.toml; then
    # Добавляем healthcheckPath в секцию [deploy]
    if grep -q "\[deploy\]" railway.toml; then
      sed -i '/\[deploy\]/a healthcheckPath = "/health"' railway.toml
      success "Добавлен healthcheckPath в railway.toml"
    else
      # Если нет секции [deploy], добавляем ее
      echo -e "\n[deploy]\nhealthcheckPath = \"/health\"\nhealthcheckTimeout = 300\nrestartPolicyType = \"always\"" >> railway.toml
      success "Добавлена секция [deploy] с healthcheckPath в railway.toml"
    fi
  else
    success "healthcheckPath уже настроен в railway.toml"
  fi
fi

# Создание nixpacks.toml
status "Проверка наличия nixpacks.toml..."
if [ ! -f "nixpacks.toml" ]; then
  cat > nixpacks.toml << EOF
[phases.setup]
nixPkgs = ["nodejs-18_x", "npm-9_x"]

[phases.install]
cmds = ["npm install"]

[phases.build]
cmds = ["echo 'Build phase'"]

[start]
cmd = "npm start"

[variables]
NODE_ENV = "production"
EOF
  success "Создан nixpacks.toml"
else
  success "nixpacks.toml уже существует"
fi

# Проверка .env файла
status "Проверка .env файла..."
if [ ! -f ".env" ]; then
  cat > .env << EOF
NODE_ENV=production
PORT=3000
RAILWAY_PUBLIC_URL=https://web-production-73916.up.railway.app
EOF
  success "Создан .env файл"
else
  # Проверяем наличие PORT и RAILWAY_PUBLIC_URL
  if ! grep -q "PORT=" .env; then
    echo "PORT=3000" >> .env
    success "Добавлена переменная PORT в .env"
  fi
  
  if ! grep -q "RAILWAY_PUBLIC_URL=" .env; then
    echo "RAILWAY_PUBLIC_URL=https://web-production-73916.up.railway.app" >> .env
    success "Добавлена переменная RAILWAY_PUBLIC_URL в .env"
  fi
  
  success ".env файл проверен и обновлен"
fi

# Создание .node-version
status "Проверка .node-version..."
if [ ! -f ".node-version" ]; then
  echo "18.17.0" > .node-version
  success "Создан .node-version"
else
  success ".node-version уже существует"
fi

# Создание README.md с инструкциями
status "Проверка README.md..."
if [ ! -f "README.md" ]; then
  cat > README.md << EOF
# VHM24 VendHub Management System

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
EOF
  success "Создан README.md с инструкциями"
else
  success "README.md уже существует"
fi

# Создание RAILWAY_DEPLOYMENT_GUIDE.md
status "Создание руководства по деплою на Railway..."
cat > RAILWAY_DEPLOYMENT_GUIDE.md << EOF
# Руководство по деплою на Railway

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
EOF
success "Создано руководство RAILWAY_DEPLOYMENT_GUIDE.md"

# Финальное сообщение
echo ""
echo "======================================================="
echo -e "${GREEN}✅ RAILWAY DEPLOYMENT FIXER ЗАВЕРШЕН${NC}"
echo "======================================================="
echo ""
echo -e "${BLUE}Что было сделано:${NC}"
echo "1. Проверен и исправлен package.json"
echo "2. Проверен и исправлен основной файл сервера"
echo "3. Создан Procfile"
echo "4. Создан/обновлен railway.toml"
echo "5. Создан nixpacks.toml"
echo "6. Проверен .env файл"
echo "7. Создан .node-version"
echo "8. Создан README.md с инструкциями"
echo "9. Создано руководство RAILWAY_DEPLOYMENT_GUIDE.md"
echo ""
echo -e "${YELLOW}Следующие шаги:${NC}"
echo "1. Запустите: railway up"
echo "2. Откройте Railway Dashboard: https://railway.app/project/740ca318-2ca1-49bb-8827-75feb0a5639c"
echo "3. Проверьте настройки Web Service"
echo "4. Если деплой не появился, создайте его вручную через Dashboard"
echo ""
echo -e "${GREEN}Готово!${NC}"
