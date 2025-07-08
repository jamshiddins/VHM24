# VHM24 - Railway Deployment Guide

## 📋 Содержание
1. [Быстрый старт](#быстрый-старт)
2. [Настройка базы данных](#настройка-базы-данных)
3. [Переменные окружения](#переменные-окружения)
4. [Развертывание](#развертывание)
5. [Проверка работоспособности](#проверка-работоспособности)
6. [Устранение неполадок](#устранение-неполадок)

## 🚀 Быстрый старт

### 1. Подготовка проекта
```bash
# Клонируйте репозиторий
git clone https://github.com/jamshiddins/VHM24.git
cd VHM24

# Установите зависимости
npm install
```

### 2. Создайте проект на Railway
1. Зайдите на [railway.app](https://railway.app)
2. Создайте новый проект
3. Подключите GitHub репозиторий

### 3. Добавьте PostgreSQL
1. В Railway Dashboard нажмите "New Service"
2. Выберите "Database" → "Add PostgreSQL"
3. Скопируйте DATABASE_URL из настроек базы данных

## 🗄️ Настройка базы данных

### Вариант 1: Использование Railway PostgreSQL
```bash
# В Railway Dashboard добавьте переменные:
DATABASE_URL=postgresql://...  # Из Railway PostgreSQL
USE_MULTIPLE_DATABASES=false
```

### Вариант 2: Использование Supabase
```bash
# Добавьте переменные из Supabase:
DATABASE_URL=postgresql://...  # Из Supabase
DIRECT_URL=postgresql://...    # Из Supabase (для миграций)
```

### Вариант 3: Множественные базы данных
```bash
USE_MULTIPLE_DATABASES=true
AUTH_DATABASE_URL=postgresql://...
MACHINES_DATABASE_URL=postgresql://...
INVENTORY_DATABASE_URL=postgresql://...
TASKS_DATABASE_URL=postgresql://...
SHARED_DATABASE_URL=postgresql://...
```

## 🔐 Переменные окружения

### Обязательные переменные
```env
# База данных
DATABASE_URL=postgresql://user:password@host:port/database

# Безопасность
JWT_SECRET=your-secure-jwt-secret-key

# Порты (Railway автоматически устанавливает PORT)
PORT=8000
GATEWAY_PORT=8000
AUTH_PORT=3001
MACHINES_PORT=3002
INVENTORY_PORT=3003
TASKS_PORT=3004
BUNKERS_PORT=3005
```

### Опциональные переменные
```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# Redis (для кеширования)
REDIS_URL=redis://...

# Режим разработки
NODE_ENV=production
```

## 📦 Развертывание

### 1. Настройка Railway
В корне проекта уже есть файл `nixpacks.toml`:
```toml
[phases.setup]
nixPkgs = ["nodejs-18_x", "npm-9_x"]

[phases.install]
cmds = ["npm ci --production=false"]

[phases.build]
cmds = ["cd packages/database && npx prisma generate"]

[start]
cmd = "npm start"
```

### 2. Добавьте переменные в Railway
1. Откройте настройки сервиса в Railway
2. Перейдите в раздел "Variables"
3. Добавьте все необходимые переменные
4. Railway автоматически перезапустит сервис

### 3. Инициализация базы данных
После первого развертывания выполните в Railway Shell:
```bash
# Генерация Prisma клиента
cd packages/database && npx prisma generate

# Применение миграций
cd packages/database && npx prisma migrate deploy

# Создание начальных данных (опционально)
cd packages/database && npm run seed
```

## ✅ Проверка работоспособности

### 1. Проверьте статус сервисов
```bash
# Health check
curl https://your-app.railway.app/health

# API статус
curl https://your-app.railway.app/api/v1/test-db
```

### 2. Проверьте логи
В Railway Dashboard:
1. Откройте ваш сервис
2. Перейдите в раздел "Logs"
3. Убедитесь, что все сервисы запустились

### 3. Ожидаемый вывод
```
🚀 VHM24 Platform starting...
Environment: production
Mode: Single Process (Railway)
✅ Auth started
✅ Machines started
✅ Inventory started
✅ Tasks started
✅ Bunkers started
✅ All services started!
```

## 🔧 Устранение неполадок

### Ошибка: Missing DATABASE_URL
**Решение**: Добавьте DATABASE_URL в переменные Railway

### Ошибка: Port already in use
**Решение**: Railway автоматически назначает PORT, не устанавливайте его вручную

### Ошибка: Prisma Client not generated
**Решение**: 
```bash
cd packages/database && npx prisma generate
```

### Ошибка: Database connection failed
**Решение**: 
1. Проверьте DATABASE_URL
2. Убедитесь, что база данных доступна
3. Проверьте SSL настройки (добавьте ?sslmode=require к URL)

## 📱 Telegram Bot

Для активации Telegram бота:
1. Создайте бота через @BotFather
2. Получите токен
3. Добавьте в Railway: `TELEGRAM_BOT_TOKEN=your-token`
4. Бот автоматически запустится при перезапуске

## 🔄 Обновление

Для обновления приложения:
1. Сделайте push в GitHub
2. Railway автоматически развернет новую версию
3. Проверьте логи на наличие ошибок

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи в Railway Dashboard
2. Убедитесь, что все переменные окружения установлены
3. Проверьте статус базы данных
4. Создайте issue в GitHub репозитории
