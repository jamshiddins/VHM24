# 🔐 Railway Environment Variables Setup

## ⚠️ Важно!

В логах видно, что база данных не доступна. Убедитесь, что вы:
1. Добавили PostgreSQL сервис в Railway
2. Правильно настроили переменные окружения

## 📋 Обязательные переменные

### 1. База данных (автоматически от Railway)
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
```
⚠️ **Важно**: Используйте референс на Railway PostgreSQL сервис!

### 2. Redis (автоматически от Railway)
```
REDIS_URL=${{Redis.REDIS_URL}}
```

### 3. JWT Configuration
```
JWT_SECRET=your-super-secret-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d
```

### 4. Telegram Bot (опционально)
```
TELEGRAM_BOT_TOKEN=your-bot-token-from-botfather
ADMIN_IDS=123456789
```
Если не используете Telegram бота, не добавляйте эти переменные.

### 5. Системные переменные
```
NODE_ENV=production
PORT=${{PORT}}
```

## 🚀 Как настроить в Railway

1. **Откройте ваш сервис** в Railway Dashboard
2. Перейдите в **Variables** tab
3. Нажмите **Raw Editor**
4. Вставьте:

```env
# Database - ВАЖНО: сначала добавьте PostgreSQL сервис!
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis - ВАЖНО: сначала добавьте Redis сервис!
REDIS_URL=${{Redis.REDIS_URL}}

# JWT
JWT_SECRET=your-super-secret-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d

# System
NODE_ENV=production
PORT=${{PORT}}

# Optional: Telegram Bot
# TELEGRAM_BOT_TOKEN=your-token
# ADMIN_IDS=your-id
```

## ❌ Ошибка "Can't reach database server"

Эта ошибка означает, что:
1. PostgreSQL сервис не добавлен в Railway
2. Или DATABASE_URL не настроен правильно

### Решение:
1. В Railway Dashboard нажмите **New** → **Database** → **Add PostgreSQL**
2. Дождитесь создания базы данных
3. В переменных вашего приложения добавьте:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```
4. Railway автоматически подставит правильный URL

## 🔍 Проверка

После настройки переменных:
1. Railway автоматически перезапустит приложение
2. Проверьте логи - не должно быть ошибок подключения к БД
3. Откройте `/health` endpoint для проверки

## 📝 Чеклист

- [ ] PostgreSQL сервис добавлен
- [ ] Redis сервис добавлен
- [ ] DATABASE_URL использует референс `${{Postgres.DATABASE_URL}}`
- [ ] REDIS_URL использует референс `${{Redis.REDIS_URL}}`
- [ ] JWT_SECRET изменен на безопасный
- [ ] NODE_ENV установлен в production

---
*Обновлено: 09.01.2025*
