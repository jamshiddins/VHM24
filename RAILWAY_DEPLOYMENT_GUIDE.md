# 🚂 VHM24 Railway Deployment Guide

**Статус:** ✅ Готов к деплою на Railway  
**URL после деплоя:** `https://vhm24-backend-production.up.railway.app`

---

## 📋 Пошаговый Railway Deployment

### 1. Установка Railway CLI (если не установлен)
```bash
# Windows
iwr https://railway.app/install.ps1 | iex

# macOS/Linux
curl -fsSL https://railway.app/install.sh | sh

# npm
npm install -g @railway/cli
```

### 2. Логин в Railway
```bash
railway login
```

### 3. Деплой проекта
```bash
# В корневой директории VHM24
railway link

# Или создать новый проект
railway init

# Deploy
railway up
```

### 4. Добавление PostgreSQL Database
```bash
# Добавить PostgreSQL addon
railway add postgresql

# Получить DATABASE_URL
railway variables
```

### 5. Настройка Environment Variables
```bash
# Установка переменных через CLI
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=vhm24-super-secret-jwt-key-production-2025
railway variables set PORT=8000
railway variables set TELEGRAM_BOT_TOKEN=your-telegram-bot-token
railway variables set REDIS_URL=redis://redis-host:6379

# DATABASE_URL автоматически добавляется при подключении PostgreSQL
```

### 6. Deploy с переменными
```bash
railway up --detach
```

---

## 🔧 Railway Configuration

### railway.toml настройки:
- ✅ Nixpacks builder (автоматическое определение Node.js)
- ✅ Health check endpoint `/health`
- ✅ Restart policy: always
- ✅ Environment variables настроены
- ✅ Build и start команды оптимизированы

### Поддерживаемые services:
- ✅ **vhm24-backend** - Основной API сервер
- ✅ **PostgreSQL Database** - Автоматически добавляется
- ✅ **Redis** - Опционально для кэширования

---

## 🌐 Production URLs

После успешного деплоя:

### Health Check:
```
GET https://vhm24-backend-production.up.railway.app/health
```

### API Endpoints:
```
POST https://vhm24-backend-production.up.railway.app/api/v1/auth/login
GET  https://vhm24-backend-production.up.railway.app/api/v1/auth/me
GET  https://vhm24-backend-production.up.railway.app/api/v1/users
GET  https://vhm24-backend-production.up.railway.app/api/v1/bags
GET  https://vhm24-backend-production.up.railway.app/api/v1/expenses
GET  https://vhm24-backend-production.up.railway.app/api/v1/revenues
GET  https://vhm24-backend-production.up.railway.app/api/v1/incassations
GET  https://vhm24-backend-production.up.railway.app/api/v1/reconciliations
```

---

## 🔐 Environment Variables для Railway

### Автоматически настраиваемые:
```bash
DATABASE_URL=postgresql://postgres:password@host:port/railway  # Автоматически
PORT=$PORT  # Автоматически назначается Railway
RAILWAY_ENVIRONMENT=production  # Автоматически
```

### Необходимо настроить вручную:
```bash
NODE_ENV=production
JWT_SECRET=vhm24-super-secret-jwt-key-production-2025
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# Optional
REDIS_URL=redis://redis-host:6379
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
```

---

## 📊 Railway Features & Limits

### Included Features:
- ✅ **PostgreSQL Database** - Автоматическое резервное копирование
- ✅ **Custom Domains** - Подключение собственных доменов
- ✅ **SSL Certificates** - Автоматические HTTPS
- ✅ **Monitoring** - Встроенная аналитика
- ✅ **Logs** - Real-time логирование
- ✅ **Auto-scaling** - Автоматическое масштабирование

### Resource Limits (Starter Plan):
- ✅ **Memory:** 512MB RAM
- ✅ **CPU:** Shared vCPU
- ✅ **Storage:** 1GB
- ✅ **Bandwidth:** 100GB/month
- ✅ **Uptime:** 99.9% SLA

---

## 🚀 Quick Deploy Commands

### Быстрый деплой:
```bash
# 1. Клонировать репозиторий
git clone https://github.com/jamshiddins/VHM24.git
cd VHM24

# 2. Установить Railway CLI
npm install -g @railway/cli

# 3. Логин
railway login

# 4. Создать проект
railway init vhm24-backend

# 5. Добавить PostgreSQL
railway add postgresql

# 6. Настроить environment variables
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=vhm24-super-secret-jwt-key-production-2025
railway variables set TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# 7. Deploy
railway up

# 8. Проверить статус
railway status
```

### После деплоя - тестирование:
```bash
# Health check
curl https://your-app.up.railway.app/health

# Auth test
curl -X POST https://your-app.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

---

## 🔍 Troubleshooting

### 1. Build Errors
```bash
# Посмотреть логи build
railway logs --deployment

# Проверить локально
npm install
npm run build
npm run start:prod
```

### 2. Database Connection
```bash
# Проверить DATABASE_URL
railway variables

# Подключиться к БД
railway connect postgresql

# Запустить миграции
railway run npx prisma migrate deploy
```

### 3. Environment Variables
```bash
# Список всех переменных
railway variables

# Обновить переменную
railway variables set VARIABLE_NAME=new_value

# Удалить переменную
railway variables delete VARIABLE_NAME
```

### 4. Domain Issues
```bash
# Добавить custom domain
railway domain add yourdomain.com

# Проверить DNS settings
railway domain list
```

---

## 📈 Monitoring & Analytics

### Railway Dashboard:
- ✅ Resource usage (CPU, Memory, Network)
- ✅ Request metrics
- ✅ Error tracking
- ✅ Deployment history
- ✅ Real-time logs

### Health Check Monitoring:
```bash
# Endpoint для мониторинга
GET /health

# Ожидаемый ответ:
{
  "status": "ok",
  "service": "VHM24 Backend",
  "timestamp": "2025-07-14T08:00:00.000Z",
  "uptime": "1h 30m 45s",
  "memory": {
    "used": "45MB",
    "free": "467MB"
  }
}
```

---

## 🎯 Database Setup

### После деплоя настроить БД:

1. **Prisma Migration:**
   ```bash
   railway run npx prisma migrate deploy
   railway run npx prisma generate
   ```

2. **Seed Database (опционально):**
   ```bash
   railway run npx prisma db seed
   ```

3. **Prisma Studio (для управления данными):**
   ```bash
   railway run npx prisma studio
   ```

---

## 🔒 Security Features

### Автоматически включены:
- ✅ **HTTPS/SSL** - Все connections зашифрованы
- ✅ **Environment Isolation** - Переменные изолированы
- ✅ **Database Encryption** - PostgreSQL encrypted at rest
- ✅ **Network Security** - Private network для сервисов

### Рекомендуемые настройки:
```bash
# Сильный JWT secret
JWT_SECRET=complex-random-string-minimum-32-characters

# Database connection security
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require

# Rate limiting (если нужно)
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=100
```

---

## ✅ Railway Deployment Checklist

### Pre-deployment:
- [x] railway.toml конфигурация создана
- [x] railway.json настроен
- [x] package.json scripts подготовлены  
- [x] Environment variables подготовлены
- [x] Health check endpoint работает
- [x] Database schema готова

### During deployment:
- [ ] Railway CLI установлен
- [ ] Успешный логин в Railway
- [ ] Project создан или linked
- [ ] PostgreSQL addon добавлен
- [ ] Environment variables настроены
- [ ] Production деплой выполнен

### Post-deployment:
- [ ] Health check работает на production URL
- [ ] Database migrations применены
- [ ] API endpoints отвечают корректно
- [ ] SSL certificate активен
- [ ] Custom domain настроен (опционально)
- [ ] Monitoring настроен

---

## 💡 Railway vs Other Platforms

### Преимущества Railway:
- ✅ **Простота деплоя** - Один клик для PostgreSQL
- ✅ **Автоматические миграции** - Prisma integration
- ✅ **Встроенный мониторинг** - Не нужны внешние сервисы
- ✅ **Fair pricing** - Pay-as-you-use модель
- ✅ **Git integration** - Автоматический деплой при push

### Идеально для VHM24:
- Node.js + Express backend ✅
- PostgreSQL database ✅
- Redis для кэширования ✅
- Telegram bot integration ✅
- Real-time monitoring ✅

---

**VHM24 готов к деплою на Railway! 🚂**

*Надежный, масштабируемый и простой в управлении deployment*
