# 🚀 Railway Project: VHM24-1.0

## 📋 Активные сервисы

| Сервис | Статус | Описание |
|--------|--------|----------|
| `web` | ✅ Активен | Основной веб-сервис (web-production-73916.up.railway.app) |
| `Postgres` | ✅ Активен | База данных PostgreSQL |
| `Redis` | ✅ Активен | Кэширование и очереди задач |
| `worker` | ✅ Активен | Фоновые задачи и обработка очередей |
| `scheduler` | ✅ Активен | Планировщик периодических задач |

## 🔐 Переменные окружения

| Переменная | Описание | Статус |
|------------|----------|--------|
| `DATABASE_URL` | URL подключения к PostgreSQL | ✅ Настроена |
| `REDIS_URL` | URL подключения к Redis | ✅ Настроена |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram бота | ✅ Настроена |
| `PORT` | Порт для запуска сервера | ✅ Настроена (3000) |
| `RAILWAY_PUBLIC_URL` | Публичный URL приложения | ✅ Настроена (https://web-production-73916.up.railway.app) |
| `NODE_ENV` | Окружение запуска | ✅ Настроена (production) |
| `JWT_SECRET` | Секрет для JWT токенов | ✅ Настроена |
| `ADMIN_IDS` | ID администраторов Telegram | ✅ Настроена |
| `WEBHOOK_URL` | URL для вебхука Telegram | ✅ Настроена |
| `S3_*` | Переменные для S3 хранилища | ✅ Настроены |

## 🔄 Автоматическая настройка

При запуске приложения автоматически выполняются следующие действия:

1. Проверка наличия всех необходимых переменных окружения
2. Подключение к базе данных PostgreSQL
3. Подключение к Redis
4. Настройка вебхука Telegram бота на URL `${RAILWAY_PUBLIC_URL}/api/telegram/webhook`
5. Запуск API сервера на порту `PORT`
6. Запуск Telegram бота

## 🌐 Публичные URL

- **API**: https://web-production-73916.up.railway.app/api
- **Telegram Webhook**: https://web-production-73916.up.railway.app/api/telegram/webhook
- **Health Check**: https://web-production-73916.up.railway.app/api/health

## 📊 Мониторинг

- **Health Check**: Доступен по адресу `/api/health`
- **Detailed Health**: Доступен по адресу `/api/health/detailed`
- **API Info**: Доступен по адресу `/api/health/info`

## 🔧 Обслуживание

Для обновления приложения достаточно выполнить push в репозиторий. Railway автоматически выполнит сборку и деплой новой версии.
