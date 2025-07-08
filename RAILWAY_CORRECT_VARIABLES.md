# ⚠️ ВАЖНО: Правильная настройка переменных в Railway

## ❌ Проблема:
Вы используете локальные/Supabase URL в Railway, но нужно использовать Railway сервисы!

## ✅ Правильные переменные для Railway:

### В Railway Dashboard → Variables → Raw Editor:

```env
# Database - используйте Railway PostgreSQL!
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis - используйте Railway Redis!
REDIS_URL=${{Redis.REDIS_URL}}

# JWT (ваш сгенерированный)
JWT_SECRET=933f4234d58f69c74957860bf5a7a838e7c6f51f36876e5d415842bd796d6b5e
JWT_EXPIRES_IN=7d

# Telegram Bot
TELEGRAM_BOT_TOKEN=8015112367:AAHi25gHhI3p1X1uyuCAt8vUnlMZRrcoKEQ
ADMIN_IDS=42283329

# Environment
NODE_ENV=production
```

## ⚠️ НЕ используйте в Railway:
```
# ❌ НЕПРАВИЛЬНО - это локальные URL!
DATABASE_URL=postgresql://postgres:rxkEqEMCmEx1pQDu@db.pgghdmepazenwkrmagvy.supabase.co:5432/postgres
REDIS_URL=redis://localhost:6379
```

## 📋 Важные моменты:

1. **${{Postgres.DATABASE_URL}}** - это референс на Railway PostgreSQL
2. **${{Redis.REDIS_URL}}** - это референс на Railway Redis
3. Railway автоматически подставит правильные URL

## 🔍 Как проверить:

1. После сохранения переменных Railway покажет resolved значения
2. DATABASE_URL должен начинаться с `postgresql://postgres:...@...railway.internal...`
3. REDIS_URL должен содержать Railway домен

## 💡 Если референсы не работают:

1. Проверьте точное название сервисов в Railway
2. Может быть `PostgreSQL` вместо `Postgres`
3. Тогда используйте: `DATABASE_URL=${{PostgreSQL.DATABASE_URL}}`

---
*Главное - НЕ копируйте локальные URL в Railway!*
