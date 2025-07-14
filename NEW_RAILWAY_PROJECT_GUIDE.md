# 🚂 ПОШАГОВОЕ СОЗДАНИЕ НОВОГО RAILWAY ПРОЕКТА

## ШАГ 1: УДАЛЕНИЕ СТАРОГО ПРОЕКТА

1. Перейдите на https://railway.app
2. Войдите в ваш аккаунт
3. Откройте проект **VHM24**
4. Перейдите в **Settings** → **Danger Zone**
5. Нажмите **Delete Project**
6. Подтвердите удаление

## ШАГ 2: СОЗДАНИЕ НОВОГО ПРОЕКТА

1. На главной странице Railway нажмите **"New Project"**
2. Выберите **"Deploy from GitHub repo"**
3. Найдите и выберите репозиторий **jamshiddins/VHM24**
4. Branch: **main**
5. Назовите проект **VHM24-NEW**
6. Нажмите **"Deploy"**

## ШАГ 3: ДОБАВЛЕНИЕ DATABASES

### PostgreSQL Database:
1. В проекте нажмите **"Add Service"**
2. Выберите **"Database"** → **"PostgreSQL"**
3. Дождитесь инициализации (2-3 минуты)

### Redis Database:
1. В проекте нажмите **"Add Service"**
2. Выберите **"Database"** → **"Redis"**
3. Дождитесь инициализации (1-2 минуты)

## ШАГ 4: НАСТРОЙКА ENVIRONMENT VARIABLES

1. Откройте VHM24-NEW service (основной сервис приложения)
2. Перейдите на вкладку **"Variables"**
3. Добавьте следующие переменные:

### Reference Variables (важно!):
- **DATABASE_URL** → Reference Variable → PostgreSQL Database
- **REDIS_URL** → Reference Variable → Redis Database

### Основные переменные (скопируйте из RAILWAY_ENV_VARIABLES.txt):

```
NODE_ENV=production
PORT=8000
GATEWAY_PORT=8000
JWT_SECRET=933f4234d58f69c74957860bf5a7a838e7c6f51f36876e5d415842bd796d6b5e
JWT_EXPIRES_IN=7d
AUTH_PORT=3001
MACHINES_PORT=3002
INVENTORY_PORT=3003
TASKS_PORT=3004
BUNKERS_PORT=3005
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_REGION=nyc3
S3_BUCKET=vhm24-uploads-2025
S3_ACCESS_KEY=DO00XEB6BC6XZ8Q2M4KQ
S3_SECRET_KEY=SeYpfXGQ4eKR8WEDdGKjtLo0c6BK82r2hfnrzB63swk
AWS_ACCESS_KEY_ID=DO00XEB6BC6XZ8Q2M4KQ
AWS_SECRET_ACCESS_KEY=SeYpfXGQ4eKR8WEDdGKjtLo0c6BK82r2hfnrzB63swk
AWS_REGION=nyc3
AWS_S3_BUCKET=vhm24-uploads-2025
TELEGRAM_BOT_TOKEN=8015112367:AAHi25gHhI3p1X1uyuCAt8vUnlMZRrcoKEQ
ADMIN_IDS=42283329X
USE_MULTIPLE_DATABASES=false
EMAIL_FROM=noreply@vhm24.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SENTRY_DSN=
LOG_LEVEL=info
START_COMMAND=npm start
```

## ШАГ 5: АВТОМАТИЧЕСКИЙ DEPLOYMENT

После добавления всех переменных Railway автоматически:
- ✅ Склонирует код из GitHub
- ✅ Установит зависимости (npm ci)
- ✅ Сгенерирует Prisma клиент
- ✅ Применит миграции базы данных
- ✅ Запустит приложение
- ✅ Создаст публичный URL

## ШАГ 6: ПРОВЕРКА РАБОТОСПОСОБНОСТИ

1. Дождитесь завершения deployment (5-10 минут)
2. Скопируйте публичный URL (например: https://vhm24-new-production.up.railway.app)
3. Проверьте health endpoint:
   ```
   https://your-new-url.up.railway.app/health
   ```
4. Ожидаемый ответ:
   ```json
   {"status":"ok","timestamp":"2025-07-14T..."}
   ```

## ШАГ 7: ОБНОВЛЕНИЕ WEBHOOK URL (опционально)

Если используете Telegram бот:
1. Получите новый публичный URL
2. Обновите переменную **TELEGRAM_WEBHOOK_URL**:
   ```
   https://your-new-url.up.railway.app/webhook
   ```

## ОЖИДАЕМЫЙ РЕЗУЛЬТАТ

✅ **Полностью рабочий VHM24 на новом Railway проекте**
✅ **PostgreSQL + Redis работают**
✅ **DigitalOcean S3 подключен**
✅ **Все 24 API endpoint'а доступны**
✅ **Telegram bot готов к работе**

## TROUBLESHOOTING

### Если deployment не запускается:
1. Проверьте что DATABASE_URL и REDIS_URL настроены как Reference Variables
2. Убедитесь что все обязательные переменные добавлены
3. Проверьте логи в Railway Dashboard

### Если 502 ошибки:
1. Дождитесь завершения Prisma миграций (может занять 5-10 минут)
2. Проверьте что PORT=8000 установлен
3. Перезапустите deployment если необходимо

## ВРЕМЯ РАЗВЕРТЫВАНИЯ

- **Создание проекта**: 2-3 минуты
- **Добавление databases**: 3-5 минут  
- **Настройка переменных**: 5-10 минут
- **Автоматический deployment**: 5-10 минут
- **Общее время**: 15-30 минут

**🎉 VHM24 будет полностью готов к production использованию!**
