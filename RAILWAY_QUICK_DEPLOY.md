# 🚂 VHM24 - Railway Quick Deploy

## 🚀 Быстрый деплой (5 минут)

### 1. Подготовка проекта
```bash
# Запустите скрипт подготовки
node prepare-for-railway.js
```

### 2. Загрузка на GitHub
```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### 3. Railway Dashboard

1. **Откройте проект**: https://railway.app/project/9820e0f0-e39b-4719-9580-de68a0e3498f

2. **Добавьте сервисы**:
   - New → Database → **PostgreSQL**
   - New → Database → **Redis**
   - New → GitHub Repo → **Выберите ваш репозиторий**

3. **Настройте переменные** (Variables tab):
```env
JWT_SECRET=сгенерируйте-64-символов-здесь
JWT_EXPIRES_IN=7d
TELEGRAM_BOT_TOKEN=ваш-токен-от-botfather
ADMIN_IDS=ваш-telegram-id
NODE_ENV=production
```

4. **Deploy** → Railway автоматически запустит деплой

### 4. После деплоя

```bash
# Миграции БД (в Railway Shell или через CLI)
railway run npm run db:migrate

# Или через веб-консоль Railway
npm run db:migrate
```

### 5. Проверка

Откройте в браузере:
- Health: `https://your-app.railway.app/health`
- API: `https://your-app.railway.app/api/v1/test-db`

## ✅ Готово!

Ваше приложение работает на Railway!

### 🔧 Полезные команды

```bash
# Логи
railway logs

# Консоль
railway shell

# Переменные
railway variables

# Статус
railway status
```

### 📱 Telegram Bot

Если настроен `TELEGRAM_BOT_TOKEN`:
1. Найдите вашего бота в Telegram
2. Отправьте `/start`
3. Используйте команды бота

### 🆘 Проблемы?

- Проверьте логи: `railway logs`
- Убедитесь что все переменные настроены
- Проверьте что PostgreSQL и Redis запущены
- См. полную документацию: `RAILWAY_DEPLOYMENT_GUIDE.md`

---
**Project ID**: `9820e0f0-e39b-4719-9580-de68a0e3498f`
