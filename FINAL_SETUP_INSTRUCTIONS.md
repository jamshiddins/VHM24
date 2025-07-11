# 🚀 VHM24 - Финальная инструкция по настройке и запуску

## ✅ Что уже сделано:

1. **Prisma клиент сгенерирован** - код для работы с базой данных готов
2. **Web Dashboard работает** - интерфейс доступен на http://localhost:3000
3. **Созданы все необходимые скрипты** для запуска
4. **Исправлены критические ошибки** в коде

## 📋 Что нужно сделать вам:

### 1. Получите данные от ваших облачных сервисов:

#### Railway PostgreSQL:

1. Зайдите в ваш проект на Railway
2. Откройте сервис PostgreSQL
3. Перейдите во вкладку "Connect"
4. Скопируйте `DATABASE_URL`

#### Redis (Railway или другой):

1. Если используете Railway Redis - скопируйте `REDIS_URL` оттуда же
2. Если другой сервис - получите connection string

#### DigitalOcean Spaces:

1. Зайдите в DigitalOcean
2. Откройте Spaces
3. Получите Access Key и Secret Key

### 2. Обновите .env файл:

```bash
# Откройте .env.production и вставьте ваши данные
notepad .env.production

# Затем скопируйте в основной .env
copy .env.production .env
```

### 3. Примените миграции к базе данных:

```bash
npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma
```

Если миграции не применяются, попробуйте сначала:

```bash
npx prisma db push --schema=packages/database/prisma/schema.prisma
```

### 4. Запустите проект локально:

```bash
node start-with-railway.js
```

## 🌐 Для деплоя на Railway:

### Вариант 1: Монолитный деплой (рекомендуется)

1. **Создайте один проект на Railway**
2. **Подключите GitHub репозиторий**
3. **Добавьте переменные окружения:**
   - DATABASE_URL (от Railway PostgreSQL)
   - REDIS_URL (от Railway Redis)
   - JWT_SECRET (сгенерирован автоматически)
   - S3_ACCESS_KEY, S3_SECRET_KEY (от DigitalOcean)
   - TELEGRAM_BOT_TOKEN (от BotFather)

4. **Railway автоматически задеплоит проект**

### Вариант 2: Микросервисный деплой

Создайте отдельные сервисы на Railway для каждого компонента:

- Gateway (порт 8000)
- Auth (порт 3001)
- Web Dashboard (порт 3000)
- И так далее...

## 📱 Для работы Telegram бота:

1. Получите токен от @BotFather в Telegram
2. Добавьте в .env:
   ```
   TELEGRAM_BOT_TOKEN=ваш-токен
   ADMIN_IDS=ваш-telegram-id
   ```

## 🔧 Если что-то не работает:

### Ошибка "Cannot find module '.prisma/client/default'":

```bash
npx prisma generate --schema=packages/database/prisma/schema.prisma
```

### Ошибка с bcrypt:

```bash
npm uninstall bcrypt
npm install bcrypt
```

### Ошибка подключения к базе:

- Проверьте DATABASE_URL
- Убедитесь, что база доступна
- Проверьте файрвол/whitelist IP

## 📊 Проверка работы:

1. **Web Dashboard:** http://localhost:3000
2. **API Gateway:** http://localhost:8000/health
3. **Auth Service:** http://localhost:3001/health

## 🎉 Готово!

После выполнения всех шагов ваш проект будет полностью готов к работе с:

- ✅ Railway PostgreSQL для базы данных
- ✅ Redis для кеширования
- ✅ DigitalOcean Spaces для файлов
- ✅ Telegram Bot для уведомлений

**Localhost** - для локальной разработки **Railway** - для production деплоя
