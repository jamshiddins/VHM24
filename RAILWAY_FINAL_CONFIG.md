# 🚀 Railway - Финальная конфигурация VHM24

## ✅ Ваш Railway домен:
- Внутренний: `vhm24.railway.internal`
- Публичный: Найдите в Settings → Domains (например: `vhm24-production.up.railway.app`)

## 📋 Финальные переменные для Railway:

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

# API URL - используйте ПУБЛИЧНЫЙ домен!
API_URL=https://vhm24-production.up.railway.app/api/v1

# Environment
NODE_ENV=production
```

## ⚠️ ВАЖНО:
1. **НЕ добавляйте PORT** - Railway назначит автоматически
2. **API_URL должен быть ПУБЛИЧНЫМ** - не `railway.internal`
3. **Найдите публичный URL** в Railway Settings → Domains

## 🔍 Где найти публичный URL:
1. Railway Dashboard → ваш проект
2. Settings → Domains
3. Скопируйте URL (обычно `*.up.railway.app`)
4. Добавьте `/api/v1` для API_URL

## ✅ Чеклист:
- [ ] Удалены все переменные PORT
- [ ] API_URL использует публичный домен
- [ ] Все переменные добавлены
- [ ] Railway пересобрал проект

## 🎯 После настройки:
1. Создайте админа локально:
   ```bash
   npm run db:migrate
   node packages/database/src/seed.js
   ```

2. Проверьте работу:
   - Health: `https://your-app.railway.app/health`
   - Telegram Bot: отправьте `/start`

---
*Главное - используйте публичный URL для API_URL, не внутренний!*
