# 🚂 VHM24 Railway Deployment Guide - ИСПРАВЛЕНО

## ✅ Проблемы исправлены

### 1. Конфигурация деплоя
- ✅ Создан `railway-deploy.js` - специальный скрипт для Railway
- ✅ Обновлен `nixpacks.toml` с правильными командами
- ✅ Добавлен `.railwayignore` для исключения ненужных файлов
- ✅ Улучшена обработка ошибок и логирование

### 2. Структура деплоя
```
VHM24/
├── railway-deploy.js     # Основной скрипт деплоя
├── nixpacks.toml        # Конфигурация Nixpacks
├── .railwayignore       # Исключения для деплоя
├── railway.json         # Метаданные Railway
└── package.json         # Зависимости и скрипты
```

## 🔧 Настройка Railway

### 1. Переменные окружения (обязательные)
```bash
# База данных
DATABASE_URL=postgresql://user:password@host:port/database

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Telegram Bot (опционально)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
ADMIN_IDS=your-telegram-id

# Redis (опционально)
REDIS_URL=redis://user:password@host:port

# Окружение
NODE_ENV=production
PORT=8000
```

### 2. Переменные окружения (дополнительные)
```bash
# CORS
ALLOWED_ORIGINS=https://your-domain.com,https://api.your-domain.com

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# Email (опционально)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Push уведомления (опционально)
FCM_SERVER_KEY=your-fcm-server-key
```

## 🚀 Процесс деплоя

### 1. Подготовка к деплою
```bash
# Убедитесь что все изменения закоммичены
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### 2. Railway автоматически:
1. **Setup Phase**: Устанавливает Node.js 18 и npm 9
2. **Install Phase**: Запускает `npm ci` и устанавливает workspace зависимости
3. **Build Phase**: Генерирует Prisma клиент
4. **Start Phase**: Запускает `node railway-migrate.js && node railway-deploy.js`

### 3. Что происходит при запуске:
```
🗄️ VHM24 Railway Database Migration Starting...
📍 Environment: production
🔧 Starting database migration...
✅ Prisma schema found
🔧 Generating Prisma client...
✅ Prisma client generated
🔧 Running database migrations...
✅ Database migrations completed
🔧 Testing database connection...
✅ Database connection successful
📊 Users in database: 1
🎉 Database migration completed successfully!

🚂 VHM24 Railway Deployment Starting...
📍 Environment: production
🔌 Port: 8000
🔧 Initializing Railway deployment...
🔧 Checking Prisma client...
✅ Prisma client is ready
🚀 Starting Auth service on port 3001...
🚀 Starting Machines service on port 3002...
🚀 Starting Inventory service on port 3003...
🚀 Starting Tasks service on port 3004...
🚀 Starting Bunkers service on port 3005...
🚀 Starting Notifications service on port 3006...
🤖 Starting Telegram Bot...
📡 Starting Gateway service (main)...
🎉 All services initialization started!
```

## 🔍 Диагностика проблем

### 1. Проверка логов Railway
```bash
# В Railway Dashboard -> Deployments -> View Logs
```

### 2. Частые ошибки и решения

#### ❌ "DATABASE_URL is required"
**Решение**: Добавьте DATABASE_URL в переменные окружения Railway

#### ❌ "Prisma client generation failed"
**Решение**: Проверьте что schema.prisma существует и DATABASE_URL корректен

#### ❌ "Module not found"
**Решение**: Убедитесь что все зависимости указаны в package.json

#### ❌ "Port already in use"
**Решение**: Railway автоматически назначает порты, используйте process.env.PORT

### 3. Тестирование деплоя локально
```bash
# Симуляция Railway окружения
export NODE_ENV=production
export RAILWAY_ENVIRONMENT=true
export DATABASE_URL=your-database-url
export JWT_SECRET=your-jwt-secret

# Запуск
node railway-deploy.js
```

## 📊 Мониторинг

### 1. Health Check
```
GET https://your-app.railway.app/health
```

### 2. API Endpoints
```
GET https://your-app.railway.app/api/v1/auth/me
POST https://your-app.railway.app/api/v1/auth/login
```

### 3. Логи сервисов
Railway автоматически собирает логи всех сервисов

## 🔧 Обслуживание

### 1. Обновление кода
```bash
git add .
git commit -m "Update: description"
git push origin main
# Railway автоматически пересоберет и задеплоит
```

### 2. Обновление зависимостей
```bash
npm update
git add package-lock.json
git commit -m "Update dependencies"
git push origin main
```

### 3. Миграции базы данных
```bash
# Railway автоматически запустит миграции при деплое
# Или вручную через Railway CLI:
railway run npx prisma migrate deploy
```

## 🎯 Результат

После успешного деплоя:
- ✅ Все сервисы работают в одном Railway процессе
- ✅ Gateway доступен на назначенном Railway порту
- ✅ Telegram Bot активен (если токен настроен)
- ✅ База данных подключена и мигрирована
- ✅ API доступно через Railway URL

## 📞 Поддержка

При проблемах с деплоем:
1. Проверьте логи в Railway Dashboard
2. Убедитесь что все переменные окружения настроены
3. Проверьте что DATABASE_URL корректен
4. Убедитесь что JWT_SECRET установлен

---

**Дата обновления**: 09.07.2025  
**Статус**: ✅ ГОТОВО К ДЕПЛОЮ  
**Версия**: 2.0 (исправлена)
