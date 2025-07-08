# 🔧 Исправление Gateway и API URL в Railway

## Проблема:
1. Telegram Bot использует `localhost:8000` вместо публичного URL
2. Gateway не знает свой публичный URL

## 🚀 Решение - добавьте ВСЕ эти переменные:

```env
# Database - Supabase
DATABASE_URL=postgresql://postgres:rxkEqEMCmEx1pQDu@db.pgghdmepazenwkrmagvy.supabase.co:5432/postgres

# Redis - Railway
REDIS_URL=${{Redis.REDIS_URL}}

# JWT
JWT_SECRET=933f4234d58f69c74957860bf5a7a838e7c6f51f36876e5d415842bd796d6b5e
JWT_EXPIRES_IN=7d

# Telegram Bot
TELEGRAM_BOT_TOKEN=8015112367:AAHi25gHhI3p1X1uyuCAt8vUnlMZRrcoKEQ
ADMIN_IDS=42283329

# URLs - ВАЖНО!
API_URL=${{RAILWAY_STATIC_URL}}/api/v1
RAILWAY_STATIC_URL=${{RAILWAY_STATIC_URL}}
PORT=${{PORT}}

# Environment
NODE_ENV=production
```

## ⚠️ Критически важно:

1. **API_URL** - должен быть в переменных!
2. **RAILWAY_STATIC_URL** - Railway автоматически подставит публичный URL
3. **PORT** - Railway автоматически назначит порт

## 🔍 Проверка после добавления:

В логах должно быть:
```
info: API URL: https://your-app.railway.app/api/v1
```

А НЕ:
```
info: API URL: http://localhost:8000/api/v1
```

## 💡 Если не работает:

1. Найдите ваш Railway URL в Settings → Domains
2. Добавьте напрямую:
   ```
   API_URL=https://vhm24-production.up.railway.app/api/v1
   ```

## ✅ После исправления:
- Бот будет использовать правильный API URL
- Все команды заработают
- Не будет ошибок подключения

---
*Главное - убедитесь что API_URL есть в переменных Railway!*
