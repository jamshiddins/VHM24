# 🤖 Исправление Telegram Bot в Railway

## ✅ Бот работает!
## ❌ Но не может подключиться к API

### Проблема:
Бот пытается подключиться к `http://localhost:8000/api/v1`, но в Railway это не работает!

### 🔧 Решение:

Добавьте в Railway Variables:

```env
# API URL - используйте публичный URL Railway!
API_URL=https://vhm24-production.up.railway.app/api/v1

# Или используйте переменную Railway:
API_URL=${{RAILWAY_STATIC_URL}}/api/v1
```

### 📋 Полный список переменных для Railway:

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

# API URL - ВАЖНО!
API_URL=${{RAILWAY_STATIC_URL}}/api/v1

# Environment
NODE_ENV=production
```

### 🔍 Как найти ваш Railway URL:

1. В Railway Dashboard → Settings
2. Найдите "Domains"
3. Скопируйте URL (например: `vhm24-production.up.railway.app`)
4. Добавьте `/api/v1` в конце

### ✅ После добавления API_URL:

1. Railway перезапустится
2. Бот сможет подключиться к API
3. Все команды будут работать!

### 🧪 Проверка:
- `/start` - должен показать меню входа
- `/machines` - список автоматов (после входа)
- `/tasks` - список задач (после входа)

---
*Главное - добавить правильный API_URL!*
