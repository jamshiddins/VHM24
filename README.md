# VHM24 VendHub Management System

## 📋 Обзор
VHM24 - система управления вендинговыми автоматами с веб-интерфейсом и Telegram ботом.

## 🧾 Быстрый запуск

```bash
# Установка зависимостей
npm install

# Деплой на Railway
railway up

# Настройка вебхука Telegram
npm run setup:webhook

# Проверка работоспособности
npm run check:health
```

## 🚀 Production Configuration
Проект настроен для работы в Railway с использованием следующих сервисов:

### Активные сервисы
- **Web**: https://web-production-73916.up.railway.app
- **Worker**: Фоновый обработчик задач
- **Scheduler**: Планировщик задач
- **PostgreSQL**: База данных для хранения информации
- **Redis**: Кэширование и управление сессиями

### Критически важные переменные окружения
- `DATABASE_URL`: URL подключения к PostgreSQL
- `REDIS_URL`: URL подключения к Redis
- `TELEGRAM_BOT_TOKEN`: Токен Telegram бота
- `PORT`: Порт для запуска сервера (обычно 3000)
- `RAILWAY_PUBLIC_URL`: Публичный URL приложения
- `JWT_SECRET`: Секрет для JWT токенов
- `NODE_ENV`: Окружение приложения (production)

Полный список переменных окружения и их описание можно найти в файле `.env.example`.

## 🔧 Локальный запуск

### Требования
- Node.js 16+
- PostgreSQL
- Redis

### Установка и запуск
```bash
# Установка зависимостей
npm install

# Генерация Prisma клиента
npx prisma generate

# Запуск в режиме разработки
npm run dev

# Запуск в production режиме
npm start
```

## 🌐 Деплой на Railway

### Автоматический деплой
```bash
# Деплой проекта
railway up
```

### Проверка статуса
```bash
# Проверка статуса сервисов
railway status

# Просмотр логов
railway logs
```

### Важные настройки в Railway Dashboard
1. Откройте Railway Dashboard: https://railway.app/project/740ca318-2ca1-49bb-8827-75feb0a5639c
2. Перейдите в Web Service → Settings
3. Убедитесь что:
   - Service Type: Web (exposes HTTP port)
   - Start Command: npm start
   - Health Check Path: /api/health
   - Health Check Timeout: 300s
   - Restart Policy: On failure (max 5 retries)

## 📱 Telegram Bot
Telegram бот доступен по адресу: https://t.me/VHM24_Bot

Для настройки webhook используйте:
```
WEBHOOK_URL=https://web-production-73916.up.railway.app/api/telegram/webhook
```

## 📄 Документация
- `railway.config.md` - описание активных сервисов и переменных
- `deployment_checklist.md` - статус готовности проекта
- `fix_report.md` - отчет о внесенных изменениях

## 🔍 Проверка работоспособности
Для проверки работоспособности сервиса используйте endpoint:
```
GET /api/health
```
