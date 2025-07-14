# 🚀 Railway Конфигурация VHM24

## 🧩 Информация о проекте
- **Название проекта:** VHM24-1.0
- **ID проекта:** 740ca318-2ca1-49bb-8827-75feb0a5639c
- **Публичный URL:** https://web-production-73916.up.railway.app

## 🔌 Активные сервисы
Для стабильной работы проекта используются следующие сервисы:

| Сервис | Описание | URL |
|--------|----------|-----|
| `web` | Основной веб-сервис | https://web-production-73916.up.railway.app |
| `Postgres` | База данных PostgreSQL | Подключается через DATABASE_URL |
| `Redis` | Кэширование и сессии | Подключается через REDIS_URL |

## 🔐 Переменные окружения
Ниже приведены все необходимые переменные окружения для работы проекта:

### Критически важные
| Переменная | Описание | Пример |
|------------|----------|--------|
| `DATABASE_URL` | URL подключения к PostgreSQL | postgresql://postgres:password@host:port/railway |
| `REDIS_URL` | URL подключения к Redis | redis://default:password@redis.railway.internal:6379 |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram бота | 8015112367:AAHi25gHhI3p1X1uyuCAt8vUnlMZRrcoKEQ |
| `PORT` | Порт для запуска сервера | 3000 |
| `RAILWAY_PUBLIC_URL` | Публичный URL приложения | https://web-production-73916.up.railway.app |

### Дополнительные
| Переменная | Описание | Пример |
|------------|----------|--------|
| `NODE_ENV` | Окружение приложения | production |
| `JWT_SECRET` | Секрет для JWT токенов | a8f5f167f44f4964e6c998dee827110c... |
| `ADMIN_IDS` | ID администраторов в Telegram | 42283329 |

### S3 хранилище (DigitalOcean Spaces)
| Переменная | Описание | Пример |
|------------|----------|--------|
| `S3_ENDPOINT` | Endpoint S3 хранилища | https://fra1.digitaloceanspaces.com |
| `S3_REGION` | Регион S3 хранилища | fra1 |
| `S3_BUCKET` | Основной бакет | vhm24-uploads-prod |
| `S3_ACCESS_KEY` | Ключ доступа | DO00XEB6BC6XZ8Q2M4KQ |
| `S3_SECRET_KEY` | Секретный ключ | SeYpfXGQ4eKR8WEDdGKjtLo0c6BK82r2hfnrzB63swk |

## 🔄 Webhook конфигурация
Для корректной работы Telegram бота необходимо настроить webhook:

```
WEBHOOK_URL=https://web-production-73916.up.railway.app/api/telegram/webhook
```

## 🚀 Запуск проекта
Проект запускается автоматически при деплое с помощью команды:
```
npm start
```

Эта команда запускает скрипт `start-production.js`, который в свою очередь запускает:
1. Бэкенд API (`backend/src/index.js`)
2. Telegram бота (`apps/telegram-bot/src/index.js`)

## 🔍 Проверка работоспособности
Для проверки работоспособности сервиса используется endpoint:
```
GET /api/health
```

Этот endpoint должен возвращать статус 200 и информацию о состоянии сервиса.
