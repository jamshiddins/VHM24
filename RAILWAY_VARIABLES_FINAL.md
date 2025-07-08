# 🔐 Railway - Финальная конфигурация переменных

## ✅ Redis уже настроен!
Вижу, что Redis переменные уже есть:
- `REDIS_URL` = `redis://default:${{REDIS_PASSWORD}}@${{RAILWAY_PRIVATE_DOMAIN}}:6379`

## ❌ Нужно добавить PostgreSQL

### 1. Добавьте PostgreSQL сервис:
```
Railway Dashboard → New → Database → Add PostgreSQL
```

### 2. После создания PostgreSQL, добавьте эти переменные:

```env
# Database - ОБЯЗАТЕЛЬНО!
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT - ОБЯЗАТЕЛЬНО измените secret!
JWT_SECRET=your-super-secret-key-minimum-32-characters-change-this
JWT_EXPIRES_IN=7d

# System
NODE_ENV=production
PORT=${{PORT}}

# API URLs (Railway автоматически предоставит)
API_URL=${{RAILWAY_STATIC_URL}}
RAILWAY_STATIC_URL=${{RAILWAY_STATIC_URL}}

# Telegram Bot (опционально - если используете)
# TELEGRAM_BOT_TOKEN=your-bot-token-from-botfather
# ADMIN_IDS=your-telegram-id
```

## 📋 Полный список переменных для Raw Editor:

Скопируйте и вставьте в Railway Variables → Raw Editor:

```env
# Database
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (уже есть)
REDIS_URL=${{REDIS_URL}}

# JWT Security
JWT_SECRET=change-this-to-random-32-character-string-minimum
JWT_EXPIRES_IN=7d

# Environment
NODE_ENV=production
PORT=${{PORT}}

# URLs
API_URL=${{RAILWAY_STATIC_URL}}
```

## ⚠️ ВАЖНО:

1. **DATABASE_URL** - появится только после добавления PostgreSQL сервиса
2. **JWT_SECRET** - ОБЯЗАТЕЛЬНО измените на случайную строку (минимум 32 символа)
3. **TELEGRAM_BOT_TOKEN** - добавьте только если используете Telegram бота

## 🔍 Проверка:

После добавления всех переменных:
1. Railway автоматически перезапустит приложение
2. В логах не должно быть ошибок подключения к БД
3. Все сервисы должны запуститься успешно

## 🚀 Последний шаг - миграции БД:

После успешного запуска выполните:
```bash
railway run npm run db:migrate
```

Или в Railway Shell:
```bash
cd packages/database && npx prisma migrate deploy
```

---
*Redis уже настроен ✅ | Осталось добавить PostgreSQL и переменные*
