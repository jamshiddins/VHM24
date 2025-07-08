# 🚂 VHM24 - Railway Deployment Guide

## 📋 Предварительные требования

1. Аккаунт на [Railway.app](https://railway.app)
2. Установленный Railway CLI (опционально)
3. GitHub репозиторий с проектом

## 🚀 Шаги развертывания

### 1. Подготовка проекта

Проект уже подготовлен для развертывания на Railway:
- ✅ `railway.json` - конфигурация Railway
- ✅ `index.js` - точка входа для всех сервисов
- ✅ `.env.railway` - шаблон переменных окружения

### 2. Создание сервисов в Railway

#### A. Через Railway Dashboard:

1. Перейдите в проект: https://railway.app/project/9820e0f0-e39b-4719-9580-de68a0e3498f

2. Добавьте PostgreSQL:
   - Click "New Service" → "Database" → "Add PostgreSQL"
   - Railway автоматически создаст `DATABASE_URL`

3. Добавьте Redis:
   - Click "New Service" → "Database" → "Add Redis"
   - Railway автоматически создаст `REDIS_URL`

4. Деплой основного приложения:
   - Click "New Service" → "GitHub Repo"
   - Выберите ваш репозиторий
   - Railway автоматически обнаружит `railway.json`

#### B. Через Railway CLI:

```bash
# Установка CLI
npm install -g @railway/cli

# Логин
railway login

# Линковка проекта
railway link 9820e0f0-e39b-4719-9580-de68a0e3498f

# Добавление сервисов
railway add postgresql
railway add redis

# Деплой
railway up
```

### 3. Настройка переменных окружения

В Railway Dashboard для вашего сервиса:

1. Перейдите в "Variables"
2. Добавьте следующие переменные:

```env
# JWT (ОБЯЗАТЕЛЬНО измените!)
JWT_SECRET=your-very-long-random-string-here
JWT_EXPIRES_IN=7d

# Telegram Bot (если используете)
TELEGRAM_BOT_TOKEN=your-bot-token-from-botfather
ADMIN_IDS=your-telegram-id

# Порты (Railway назначит автоматически)
PORT=${{PORT}}

# Окружение
NODE_ENV=production
```

### 4. Настройка домена

1. В настройках сервиса перейдите в "Settings"
2. В разделе "Domains" нажмите "Generate Domain"
3. Railway предоставит URL вида: `vhm24-production.up.railway.app`

### 5. Миграция базы данных

После первого деплоя выполните миграции:

```bash
# Через Railway CLI
railway run npm run db:migrate

# Или через Railway Shell в Dashboard
npm run db:migrate
```

### 6. Проверка работоспособности

После успешного деплоя проверьте:

1. **Health Check**: 
   ```
   https://your-app.railway.app/health
   ```

2. **API Test**:
   ```
   https://your-app.railway.app/api/v1/test-db
   ```

3. **Login Test**:
   ```bash
   curl -X POST https://your-app.railway.app/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@vhm24.ru","password":"admin123"}'
   ```

## 🔧 Конфигурация для продакшена

### Оптимизация для Railway:

1. **Память и CPU**:
   - В Settings → Resource Limits
   - Рекомендуется: 512MB RAM, 0.5 vCPU

2. **Автоматический рестарт**:
   - Уже настроен в `railway.json`
   - Max retries: 10

3. **Логирование**:
   - Railway автоматически собирает логи
   - Доступны в Dashboard → Logs

### Переменные окружения для продакшена:

```env
# Безопасность
JWT_SECRET=<сгенерируйте 64+ символов>
CORS_ORIGIN=https://your-frontend-domain.com

# База данных
DATABASE_URL=${{Postgres.DATABASE_URL}}
DB_POOL_MIN=2
DB_POOL_MAX=10

# Redis
REDIS_URL=${{Redis.REDIS_URL}}
REDIS_TTL=3600

# Telegram Bot
TELEGRAM_BOT_TOKEN=<от @BotFather>
TELEGRAM_WEBHOOK_URL=${{RAILWAY_STATIC_URL}}/webhook
```

## 📊 Мониторинг

### Railway Metrics:
- CPU использование
- Память
- Сетевой трафик
- Логи в реальном времени

### Внешний мониторинг:
```javascript
// Добавьте в index.js для мониторинга
const healthEndpoint = `${process.env.RAILWAY_STATIC_URL}/health`;
setInterval(async () => {
  try {
    await fetch(healthEndpoint);
    console.log('Health check passed');
  } catch (error) {
    console.error('Health check failed:', error);
  }
}, 60000); // каждую минуту
```

## 🚨 Troubleshooting

### Проблема: "Cannot connect to database"
**Решение**: Проверьте что PostgreSQL сервис запущен и `DATABASE_URL` правильный

### Проблема: "Port already in use"
**Решение**: Используйте `PORT` переменную от Railway:
```javascript
const port = process.env.PORT || 8000;
```

### Проблема: "Memory limit exceeded"
**Решение**: 
- Увеличьте лимит памяти в Settings
- Оптимизируйте код (connection pooling, caching)

### Проблема: "Build failed"
**Решение**: Проверьте логи билда:
```bash
railway logs -b
```

## 🔄 CI/CD Pipeline

### Автоматический деплой:

1. При push в `main` ветку
2. Railway автоматически:
   - Собирает проект
   - Запускает тесты (если настроены)
   - Деплоит новую версию
   - Переключает трафик

### Ручной деплой:

```bash
# Через CLI
railway up

# Через Dashboard
"Deploy" → "Trigger Deploy"
```

## 📝 Чеклист для продакшена

- [ ] Изменен JWT_SECRET
- [ ] Настроен Telegram Bot Token
- [ ] Подключены PostgreSQL и Redis
- [ ] Выполнены миграции БД
- [ ] Настроен кастомный домен (опционально)
- [ ] Проверены все health endpoints
- [ ] Настроен мониторинг
- [ ] Создан backup план

## 🆘 Поддержка

- Railway Discord: https://discord.gg/railway
- Railway Docs: https://docs.railway.app
- VHM24 Issues: https://github.com/your-repo/issues

---

**Project ID**: `9820e0f0-e39b-4719-9580-de68a0e3498f`

*Последнее обновление: 09.01.2025*
